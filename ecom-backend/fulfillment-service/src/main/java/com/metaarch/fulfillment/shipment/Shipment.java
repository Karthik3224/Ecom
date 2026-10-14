package com.metaarch.fulfillment.shipment;

import java.time.*;
import java.util.UUID;
import com.metaarch.fulfillment.common.AuditedEntity;
import com.metaarch.fulfillment.fulfillment.Fulfillment;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "shipments")
public class Shipment extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "fulfillment_id", nullable = false) private Fulfillment fulfillment;
  @Column(name = "order_id", nullable = false) private UUID orderId;
  @Column(nullable = false, length = 80) private String carrier;
  @Column(name = "tracking_number", nullable = false, unique = true, length = 120) private String trackingNumber;
  @Column(name = "delivery_partner_id", length = 100) private String deliveryPartnerId;
  @Column(name = "delivery_partner_name", length = 180) private String deliveryPartnerName;
  @Column(name = "delivery_partner_phone", length = 40) private String deliveryPartnerPhone;
  @Column(name = "delivery_partner_vehicle_number", length = 40) private String deliveryPartnerVehicleNumber;
  @Column(name = "delivery_assigned_at") private Instant deliveryAssignedAt;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30) private ShipmentStatus status;
  @Column(name = "shipped_at") private Instant shippedAt;
  @Column(name = "delivered_at") private Instant deliveredAt;
  @Column(name = "estimated_delivery_date", nullable = false) private LocalDate estimatedDeliveryDate;

  protected Shipment() { }

  public Shipment(Fulfillment fulfillment, String carrier, String trackingNumber, LocalDate estimatedDeliveryDate) {
    this.fulfillment = fulfillment;
    this.orderId = fulfillment.getOrderId();
    this.carrier = carrier;
    this.trackingNumber = trackingNumber;
    this.estimatedDeliveryDate = estimatedDeliveryDate;
    this.status = ShipmentStatus.CREATED;
  }

  public UUID getId() { return id; }
  public Fulfillment getFulfillment() { return fulfillment; }
  public UUID getFulfillmentId() { return fulfillment == null ? null : fulfillment.getId(); }
  public UUID getOrderId() { return orderId; }
  public String getCarrier() { return carrier; }
  public String getTrackingNumber() { return trackingNumber; }
  public String getDeliveryPartnerId() { return deliveryPartnerId; }
  public String getDeliveryPartnerName() { return deliveryPartnerName; }
  public String getDeliveryPartnerPhone() { return deliveryPartnerPhone; }
  public String getDeliveryPartnerVehicleNumber() { return deliveryPartnerVehicleNumber; }
  public Instant getDeliveryAssignedAt() { return deliveryAssignedAt; }
  public void assignDeliveryPartner(String id, String name, String phone, String vehicleNumber) {
    this.deliveryPartnerId = id;
    this.deliveryPartnerName = name;
    this.deliveryPartnerPhone = phone;
    this.deliveryPartnerVehicleNumber = vehicleNumber;
    this.deliveryAssignedAt = Instant.now();
  }
  public ShipmentStatus getStatus() { return status; }
  public void setStatus(ShipmentStatus status) { this.status = status; }
  public Instant getShippedAt() { return shippedAt; }
  public void setShippedAt(Instant shippedAt) { this.shippedAt = shippedAt; }
  public Instant getDeliveredAt() { return deliveredAt; }
  public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }
  public LocalDate getEstimatedDeliveryDate() { return estimatedDeliveryDate; }
}
