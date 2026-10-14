package com.metaarch.fulfillment.fulfillment;

import java.util.UUID;
import com.metaarch.fulfillment.common.AuditedEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "fulfillments")
public class Fulfillment extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(name = "order_id", nullable = false, unique = true) private UUID orderId;
  @Column(name = "customer_id", nullable = false) private UUID customerId;
  @Column(name = "store_id", nullable = false, length = 100) private String storeId;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30) private FulfillmentStatus status;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "fulfillment_type", nullable = false, length = 30) private FulfillmentType fulfillmentType;
  @Column(name = "shipping_address_id") private UUID shippingAddressId;

  protected Fulfillment() { }

  public Fulfillment(UUID orderId, UUID customerId, String storeId, FulfillmentType fulfillmentType, UUID shippingAddressId) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.storeId = storeId;
    this.fulfillmentType = fulfillmentType;
    this.shippingAddressId = shippingAddressId;
    this.status = FulfillmentStatus.PENDING;
  }

  public UUID getId() { return id; }
  public UUID getOrderId() { return orderId; }
  public UUID getCustomerId() { return customerId; }
  public String getStoreId() { return storeId; }
  public FulfillmentStatus getStatus() { return status; }
  public void setStatus(FulfillmentStatus status) { this.status = status; }
  public FulfillmentType getFulfillmentType() { return fulfillmentType; }
  public UUID getShippingAddressId() { return shippingAddressId; }
}
