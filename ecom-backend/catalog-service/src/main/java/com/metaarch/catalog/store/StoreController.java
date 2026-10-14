package com.metaarch.catalog.store;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stores")
public class StoreController {
  private final StoreService service;
  private final StoreDeliveryService deliveryService;
  public StoreController(StoreService service, StoreDeliveryService deliveryService) {
    this.service = service; this.deliveryService = deliveryService;
  }

  @PostMapping
  ResponseEntity<StoreResponse> create(@Valid @RequestBody StoreRequest request) {
    StoreResponse store = service.create(request);
    return ResponseEntity.created(URI.create("/api/v1/stores/" + store.id())).body(store);
  }

  @GetMapping
  List<StoreResponse> list(@RequestParam(required = false) Boolean active) { return service.list(active); }

  @GetMapping("/{id}")
  StoreResponse get(@PathVariable String id) { return service.get(id); }

  @PutMapping("/{id}")
  StoreResponse update(@PathVariable String id, @Valid @RequestBody StoreRequest request) { return service.update(id, request); }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@PathVariable String id) { service.delete(id); }

  @GetMapping("/{id}/delivery-zones")
  List<StoreDeliveryZoneResponse> deliveryZones(@PathVariable String id) { return deliveryService.listZones(id); }

  @GetMapping("/delivery-zones/{zoneId}/location")
  DeliveryZoneLocationResponse deliveryZoneLocation(@PathVariable Long zoneId) { return deliveryService.getZoneLocation(zoneId); }

  @PostMapping("/{id}/delivery-zones")
  ResponseEntity<StoreDeliveryZoneResponse> createDeliveryZone(@PathVariable String id, @Valid @RequestBody StoreDeliveryZoneRequest request) {
    StoreDeliveryZoneResponse zone = deliveryService.createZone(id, request);
    return ResponseEntity.created(URI.create("/api/v1/stores/" + id + "/delivery-zones/" + zone.id())).body(zone);
  }

  @PutMapping("/{storeId}/delivery-zones/{zoneId}")
  StoreDeliveryZoneResponse updateDeliveryZone(@PathVariable String storeId, @PathVariable Long zoneId, @Valid @RequestBody StoreDeliveryZoneRequest request) {
    return deliveryService.updateZone(storeId, zoneId, request);
  }

  @DeleteMapping("/{storeId}/delivery-zones/{zoneId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void deleteDeliveryZone(@PathVariable String storeId, @PathVariable Long zoneId) { deliveryService.deleteZone(storeId, zoneId); }

  @GetMapping("/{id}/delivery-quote")
  DeliveryQuoteResponse deliveryQuote(
      @PathVariable String id,
      @RequestParam java.math.BigDecimal latitude,
      @RequestParam java.math.BigDecimal longitude,
      @RequestParam(required = false) java.math.BigDecimal orderTotal,
      @RequestParam(required = false) String deliveryMethod) {
    return deliveryService.quote(id, latitude, longitude, orderTotal, deliveryMethod);
  }
}
