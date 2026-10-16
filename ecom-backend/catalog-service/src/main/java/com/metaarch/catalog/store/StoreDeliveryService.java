package com.metaarch.catalog.store;

import com.metaarch.catalog.exception.ResourceNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StoreDeliveryService {
  private static final String ACTIVE_STATUS = "Active";

  private final StoreRepository stores;
  private final StoreDeliveryZoneRepository zones;
  private final StoreDeliveryMethodRepository methods;
  private final OpenRouteServiceClient routes;
  public StoreDeliveryService(StoreRepository stores, StoreDeliveryZoneRepository zones, StoreDeliveryMethodRepository methods, OpenRouteServiceClient routes) {
    this.stores = stores; this.zones = zones; this.methods = methods; this.routes = routes;
  }

  @Transactional(readOnly = true)
  public List<StoreDeliveryZoneResponse> listZones(String storeId) {
    requireStore(storeId);
    return zones.findByStoreIdOrderByMinRadiusKmAsc(storeId).stream().map(zone -> StoreDeliveryZoneResponse.from(zone, methods.findByZoneIdOrderByDeliveryTypeAsc(zone.getId()))).toList();
  }

  @Transactional(readOnly = true)
  public DeliveryZoneLocationResponse getZoneLocation(Long deliveryZoneId) {
    StoreDeliveryZone zone = zones.findById(deliveryZoneId).orElseThrow(() -> new ResourceNotFoundException("Delivery zone not found: " + deliveryZoneId));
    return new DeliveryZoneLocationResponse(zone.getId(), zone.getStoreId(), resolveZoneLocation(zone));
  }

  @Transactional
  public StoreDeliveryZoneResponse createZone(String storeId, StoreDeliveryZoneRequest request) {
    requireStore(storeId);
    StoreDeliveryZone zone = new StoreDeliveryZone();
    zone.setStoreId(storeId);
    zone.setLocationId(resolveZoneLocation(zone));
    applyZone(zone, request);
    StoreDeliveryZone saved = zones.save(zone);
    saveMethods(saved, request.methods());
    return StoreDeliveryZoneResponse.from(saved, methods.findByZoneIdOrderByDeliveryTypeAsc(saved.getId()));
  }

  @Transactional
  public StoreDeliveryZoneResponse updateZone(String storeId, Long id, StoreDeliveryZoneRequest request) {
    requireStore(storeId);
    StoreDeliveryZone zone = zones.findById(id).filter(item -> item.getStoreId().equals(storeId)).orElseThrow(() -> new ResourceNotFoundException("Delivery zone not found: " + id));
    applyZone(zone, request);
    zone.setLocationId(resolveZoneLocation(zone));
    methods.deleteByZoneId(zone.getId());
    saveMethods(zone, request.methods());
    return StoreDeliveryZoneResponse.from(zone, methods.findByZoneIdOrderByDeliveryTypeAsc(zone.getId()));
  }

  @Transactional
  public void deleteZone(String storeId, Long id) {
    requireStore(storeId);
    StoreDeliveryZone zone = zones.findById(id).filter(item -> item.getStoreId().equals(storeId)).orElseThrow(() -> new ResourceNotFoundException("Delivery zone not found: " + id));
    zones.delete(zone);
  }

  @Transactional(readOnly = true)
  public DeliveryQuoteResponse quote(String storeId, BigDecimal customerLatitude, BigDecimal customerLongitude, BigDecimal orderTotal, String deliveryMethod) {
    Store store = requireStore(storeId);
    if ("global-store".equalsIgnoreCase(storeId) || "global".equalsIgnoreCase(deliveryMethod)) {
      return new DeliveryQuoteResponse(storeId, store.getLatitude(), store.getLongitude(), customerLatitude, customerLongitude, true, null, null, null, null, "India-wide", null, null, "global", BigDecimal.ZERO, null, false, null, null, null, false, List.of(), "Global Delivery - Tracking ID provided after dispatch");
    }
    if (store.getLatitude() == null || store.getLongitude() == null || customerLatitude == null || customerLongitude == null) {
      throw new OpenRouteServiceClient.RouteUnavailableException("Store and customer coordinates are required to verify delivery route.");
    }
    OpenRouteServiceClient.RouteResult route = routes.drivingRoute(store.getLatitude(), store.getLongitude(), customerLatitude, customerLongitude);
    BigDecimal distance = route.distanceKm();
    boolean pickupAvailable = store.isPickupEnabled() && ACTIVE_STATUS.equalsIgnoreCase(store.getStatus());
    StoreDeliveryZone zone = zones.findByStoreIdOrderByMinRadiusKmAsc(storeId).stream()
      .filter(item -> ACTIVE_STATUS.equalsIgnoreCase(item.getStatus()))
      .filter(item -> distance.compareTo(item.getMinRadiusKm()) >= 0 && distance.compareTo(item.getMaxRadiusKm()) <= 0)
      .findFirst().orElse(null);
    if (zone == null || !store.isDeliveryEnabled() || !ACTIVE_STATUS.equalsIgnoreCase(store.getStatus())) {
      List<StoreDeliveryMethodResponse> pickupMethods = methods.findByStoreIdOrderByDeliveryTypeAsc(storeId).stream()
        .filter(StoreDeliveryMethod::isEnabled)
        .filter(method -> isPickup(method.getDeliveryType()))
        .map(StoreDeliveryMethodResponse::from)
        .toList();
      String message = pickupAvailable ? "Outside delivery area. Store pickup is available." : "Outside delivery area";
      return new DeliveryQuoteResponse(storeId, store.getLatitude(), store.getLongitude(), customerLatitude, customerLongitude, false, distance, route.distanceMeters(), route.durationSeconds(), route.durationMinutes(), null, route.geometry(), null, normalizeMethod(deliveryMethod), BigDecimal.ZERO, null, false, null, null, null, pickupAvailable, pickupMethods, message);
    }
    List<StoreDeliveryMethodResponse> availableMethods = methods.findByZoneIdOrderByDeliveryTypeAsc(zone.getId()).stream().filter(StoreDeliveryMethod::isEnabled).map(StoreDeliveryMethodResponse::from).toList();
    String selectedMethod = selectedMethod(deliveryMethod, availableMethods);
    StoreDeliveryMethodResponse selected = availableMethods.stream()
      .filter(method -> sameMethod(method.deliveryType(), selectedMethod))
      .findFirst()
      .orElse(null);
    if (orderTotal != null && zone.getMinimumOrder() != null && orderTotal.compareTo(zone.getMinimumOrder()) < 0) {
      return new DeliveryQuoteResponse(storeId, store.getLatitude(), store.getLongitude(), customerLatitude, customerLongitude, false, distance, route.distanceMeters(), route.durationSeconds(), route.durationMinutes(), matchedZoneLabel(zone), route.geometry(), zone.getId(), selectedMethod, BigDecimal.ZERO, zone.getFreeDeliveryAbove(), false, zone.getMinimumOrder(), zone.getEstimatedDeliveryMin(), zone.getEstimatedDeliveryMax(), pickupAvailable, availableMethods, "Minimum order is " + zone.getMinimumOrder());
    }
    BigDecimal charge = selected != null && selected.deliveryCharge() != null ? selected.deliveryCharge() : zone.getDeliveryCharge();
    boolean freeDeliveryApplied = orderTotal != null && zone.getFreeDeliveryAbove() != null && orderTotal.compareTo(zone.getFreeDeliveryAbove()) >= 0 && !isPickup(selectedMethod);
    if (freeDeliveryApplied || isPickup(selectedMethod)) charge = BigDecimal.ZERO;
    boolean methodAvailable = selectedMethod == null || selected != null;
    return new DeliveryQuoteResponse(storeId, store.getLatitude(), store.getLongitude(), customerLatitude, customerLongitude, methodAvailable, distance, route.distanceMeters(), route.durationSeconds(), route.durationMinutes(), matchedZoneLabel(zone), route.geometry(), zone.getId(), selectedMethod, charge, zone.getFreeDeliveryAbove(), freeDeliveryApplied, zone.getMinimumOrder(), zone.getEstimatedDeliveryMin(), zone.getEstimatedDeliveryMax(), pickupAvailable, availableMethods, methodAvailable ? "Delivery available" : "Selected delivery method is unavailable for this address");
  }

  private String resolveZoneLocation(StoreDeliveryZone zone) {
    if (zone.getLocationId() != null && !zone.getLocationId().isBlank()) return zone.getLocationId().trim();
    // Inherit IDs from persisted mappings, never from a numeric zone ID or a
    // customer-supplied label. A conflicting mapping requires explicit repair.
    List<String> sameStore = zones.findByStoreIdOrderByMinRadiusKmAsc(zone.getStoreId()).stream()
        .map(StoreDeliveryZone::getLocationId).filter(java.util.Objects::nonNull)
        .map(String::trim).filter(value -> !value.isBlank()).distinct().toList();
    if (sameStore.size() == 1) return sameStore.getFirst();
    if (sameStore.size() > 1) throw new IllegalArgumentException("Store delivery location mappings conflict. Contact the store administrator.");
    Store store = requireStore(zone.getStoreId());
    List<String> region = store.getLocation() == null || store.getLocation().isBlank() ? List.of()
        : zones.findMappedLocationIdsForStoreRegion(store.getLocation().trim()).stream()
            .filter(java.util.Objects::nonNull).map(String::trim).filter(value -> !value.isBlank()).distinct().toList();
    if (region.size() == 1) return region.getFirst();
    throw new IllegalArgumentException("Store delivery location mapping is missing or ambiguous. Configure the store's location before saving delivery radius rules.");
  }

  private Store requireStore(String id) {
    return stores.findById(id).orElseThrow(() -> new ResourceNotFoundException("Store not found: " + id));
  }

  private void applyZone(StoreDeliveryZone zone, StoreDeliveryZoneRequest request) {
    if (request.maxRadiusKm().compareTo(request.minRadiusKm()) <= 0) throw new IllegalArgumentException("Maximum distance must be greater than minimum distance");
    zone.setMinRadiusKm(request.minRadiusKm());
    zone.setMaxRadiusKm(request.maxRadiusKm());
    zone.setEstimatedDeliveryMin(request.estimatedDeliveryMin());
    zone.setEstimatedDeliveryMax(request.estimatedDeliveryMax());
    zone.setDeliveryCharge(request.deliveryCharge());
    zone.setFreeDeliveryAbove(request.freeDeliveryAbove());
    zone.setMinimumOrder(request.minimumOrder());
    zone.setStatus(request.status() == null || request.status().isBlank() ? ACTIVE_STATUS : request.status().trim());
  }

  private void saveMethods(StoreDeliveryZone zone, List<StoreDeliveryMethodRequest> requests) {
    if (requests == null) return;
    for (StoreDeliveryMethodRequest request : requests) {
      StoreDeliveryMethod method = new StoreDeliveryMethod();
      method.setStoreId(zone.getStoreId());
      method.setZone(zone);
      method.setDeliveryType(request.deliveryType().trim());
      method.setEnabled(request.enabled());
      method.setDeliveryCharge(request.deliveryCharge());
      method.setEstimatedTime(request.estimatedTime());
      method.setCutoffTime(request.cutoffTime());
      method.setSettingsConfiguration(request.settingsConfiguration());
      methods.save(method);
    }
  }

  private String selectedMethod(String requestedMethod, List<StoreDeliveryMethodResponse> availableMethods) {
    String normalized = normalizeMethod(requestedMethod);
    if (normalized != null) return normalized;
    return availableMethods.stream().findFirst().map(StoreDeliveryMethodResponse::deliveryType).orElse(null);
  }

  private String normalizeMethod(String method) {
    if (method == null || method.isBlank()) return null;
    return switch (method.trim().toLowerCase()) {
      case "standard" -> "Standard Delivery";
      case "instant" -> "Instant Delivery";
      case "same-day", "sameday" -> "Same-Day Delivery";
      case "express" -> "Express Delivery";
      case "scheduled" -> "Scheduled Delivery";
      case "pickup", "store-pickup" -> "Store Pickup";
      default -> method.trim();
    };
  }

  private boolean sameMethod(String left, String right) {
    String normalizedLeft = normalizeMethod(left);
    String normalizedRight = normalizeMethod(right);
    return normalizedLeft != null && normalizedRight != null && normalizedLeft.equalsIgnoreCase(normalizedRight);
  }

  private boolean isPickup(String method) {
    return sameMethod(method, "Store Pickup");
  }

  private String matchedZoneLabel(StoreDeliveryZone zone) {
    return zone.getMinRadiusKm().stripTrailingZeros().toPlainString() + "-" + zone.getMaxRadiusKm().stripTrailingZeros().toPlainString() + " KM";
  }

}
