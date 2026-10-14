package com.metaarch.order.order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import com.metaarch.order.common.AuditedEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "orders")
public class Order extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(name = "customer_id", nullable = false) private UUID customerId;
  @Column(name = "cart_id", nullable = false) private UUID cartId;
  @Column(name = "store_id", nullable = false, length = 100) private String storeId;
  @Column(name = "delivery_zone_id") private Long deliveryZoneId;
  @Transient private String locationId;
  @Column(name = "calculated_distance_km", precision = 8, scale = 2) private BigDecimal calculatedDistanceKm;
  @Column(name = "route_distance_meters") private Long routeDistanceMeters;
  @Column(name = "route_duration_seconds") private Integer routeDurationSeconds;
  @Column(name = "route_duration_minutes") private Integer routeDurationMinutes;
  @Column(name = "matched_zone_label", length = 80) private String matchedZoneLabel;
  @Column(name = "customer_latitude", precision = 10, scale = 7) private BigDecimal customerLatitude;
  @Column(name = "customer_longitude", precision = 10, scale = 7) private BigDecimal customerLongitude;
  @Column(name = "store_latitude", precision = 10, scale = 7) private BigDecimal storeLatitude;
  @Column(name = "store_longitude", precision = 10, scale = 7) private BigDecimal storeLongitude;
  @Column(name = "delivery_method", length = 80) private String deliveryMethod;
  @Column(name = "fulfillment_type", length = 40) private String fulfillmentType;
  @Column(name = "global_approval", length = 40) private String globalApproval;
  @Column(name = "delivery_charge", nullable = false, precision = 10, scale = 2) private BigDecimal deliveryCharge = BigDecimal.ZERO;
  @Column(name = "estimated_delivery_min") private Integer estimatedDeliveryMin;
  @Column(name = "estimated_delivery_max") private Integer estimatedDeliveryMax;
  @Column(name = "free_delivery_above", precision = 10, scale = 2) private BigDecimal freeDeliveryAbove;
  @Column(name = "free_delivery_applied", nullable = false) private boolean freeDeliveryApplied;
  @Column(name = "scheduled_delivery_date") private LocalDate scheduledDeliveryDate;
  @Column(name = "scheduled_delivery_slot", length = 80) private String scheduledDeliverySlot;
  @Column(name = "pickup_details", length = 1000) private String pickupDetails;
  @Column(name = "order_number", nullable = false, unique = true, length = 40) private String orderNumber;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30) private OrderStatus status;
  @Column(name = "total_amount", nullable = false, precision = 19, scale = 2) private BigDecimal totalAmount = BigDecimal.ZERO;
  @Column(name = "handling_fee", nullable = false, precision = 10, scale = 2) private BigDecimal handlingFee = BigDecimal.ZERO;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "payment_status", nullable = false, length = 30) private PaymentStatus paymentStatus;
  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true) private List<OrderItem> items = new ArrayList<>();
  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true) private List<OrderAddress> addresses = new ArrayList<>();

  protected Order() { }

  public Order(UUID customerId, UUID cartId, String storeId, String orderNumber) {
    this.customerId = customerId;
    this.cartId = cartId;
    this.storeId = storeId;
    this.orderNumber = orderNumber;
    this.status = OrderStatus.CREATED;
    this.paymentStatus = PaymentStatus.PENDING;
  }

  public UUID getId() { return id; }
  public UUID getCustomerId() { return customerId; }
  public UUID getCartId() { return cartId; }
  public String getStoreId() { return storeId; }
  public Long getDeliveryZoneId() { return deliveryZoneId; }
  public void setDeliveryZoneId(Long deliveryZoneId) { this.deliveryZoneId = deliveryZoneId; }
  public String getLocationId() { return locationId; }
  public void setLocationId(String locationId) { this.locationId = locationId; }
  public BigDecimal getCalculatedDistanceKm() { return calculatedDistanceKm; }
  public void setCalculatedDistanceKm(BigDecimal calculatedDistanceKm) { this.calculatedDistanceKm = calculatedDistanceKm; }
  public Long getRouteDistanceMeters() { return routeDistanceMeters; }
  public void setRouteDistanceMeters(Long routeDistanceMeters) { this.routeDistanceMeters = routeDistanceMeters; }
  public Integer getRouteDurationSeconds() { return routeDurationSeconds; }
  public void setRouteDurationSeconds(Integer routeDurationSeconds) { this.routeDurationSeconds = routeDurationSeconds; }
  public Integer getRouteDurationMinutes() { return routeDurationMinutes; }
  public void setRouteDurationMinutes(Integer routeDurationMinutes) { this.routeDurationMinutes = routeDurationMinutes; }
  public String getMatchedZoneLabel() { return matchedZoneLabel; }
  public void setMatchedZoneLabel(String matchedZoneLabel) { this.matchedZoneLabel = matchedZoneLabel; }
  public BigDecimal getCustomerLatitude() { return customerLatitude; }
  public void setCustomerLatitude(BigDecimal customerLatitude) { this.customerLatitude = customerLatitude; }
  public BigDecimal getCustomerLongitude() { return customerLongitude; }
  public void setCustomerLongitude(BigDecimal customerLongitude) { this.customerLongitude = customerLongitude; }
  public BigDecimal getStoreLatitude() { return storeLatitude; }
  public void setStoreLatitude(BigDecimal storeLatitude) { this.storeLatitude = storeLatitude; }
  public BigDecimal getStoreLongitude() { return storeLongitude; }
  public void setStoreLongitude(BigDecimal storeLongitude) { this.storeLongitude = storeLongitude; }
  public String getDeliveryMethod() { return deliveryMethod; }
  public void setDeliveryMethod(String deliveryMethod) { this.deliveryMethod = deliveryMethod; }
  public String getFulfillmentType() { return fulfillmentType; }
  public void setFulfillmentType(String fulfillmentType) { this.fulfillmentType = fulfillmentType; }
  public String getGlobalApproval() { return globalApproval; }
  public void setGlobalApproval(String globalApproval) { this.globalApproval = globalApproval; }
  public BigDecimal getDeliveryCharge() { return deliveryCharge; }
  public void setDeliveryCharge(BigDecimal deliveryCharge) { this.deliveryCharge = deliveryCharge; }
  public Integer getEstimatedDeliveryMin() { return estimatedDeliveryMin; }
  public void setEstimatedDeliveryMin(Integer estimatedDeliveryMin) { this.estimatedDeliveryMin = estimatedDeliveryMin; }
  public Integer getEstimatedDeliveryMax() { return estimatedDeliveryMax; }
  public void setEstimatedDeliveryMax(Integer estimatedDeliveryMax) { this.estimatedDeliveryMax = estimatedDeliveryMax; }
  public BigDecimal getFreeDeliveryAbove() { return freeDeliveryAbove; }
  public void setFreeDeliveryAbove(BigDecimal freeDeliveryAbove) { this.freeDeliveryAbove = freeDeliveryAbove; }
  public boolean isFreeDeliveryApplied() { return freeDeliveryApplied; }
  public void setFreeDeliveryApplied(boolean freeDeliveryApplied) { this.freeDeliveryApplied = freeDeliveryApplied; }
  public LocalDate getScheduledDeliveryDate() { return scheduledDeliveryDate; }
  public void setScheduledDeliveryDate(LocalDate scheduledDeliveryDate) { this.scheduledDeliveryDate = scheduledDeliveryDate; }
  public String getScheduledDeliverySlot() { return scheduledDeliverySlot; }
  public void setScheduledDeliverySlot(String scheduledDeliverySlot) { this.scheduledDeliverySlot = scheduledDeliverySlot; }
  public String getPickupDetails() { return pickupDetails; }
  public void setPickupDetails(String pickupDetails) { this.pickupDetails = pickupDetails; }
  public String getOrderNumber() { return orderNumber; }
  public OrderStatus getStatus() { return status; }
  public void setStatus(OrderStatus status) { this.status = status; }
  public BigDecimal getTotalAmount() { return totalAmount; }
  public BigDecimal getHandlingFee() { return handlingFee; }
  public void setHandlingFee(BigDecimal handlingFee) { this.handlingFee = handlingFee; }
  public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
  public PaymentStatus getPaymentStatus() { return paymentStatus; }
  public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
  public List<OrderItem> getItems() { return items; }
  public List<OrderAddress> getAddresses() { return addresses; }
  public void addItem(OrderItem item) { item.setOrder(this); items.add(item); }
  public void addAddress(OrderAddress address) { address.setOrder(this); addresses.add(address); }
  public UUID getShippingAddressId() {
    return addresses.stream().filter(address -> address.getAddressType() == AddressType.SHIPPING).findFirst().map(OrderAddress::getId).orElse(null);
  }
}
