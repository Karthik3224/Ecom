package com.metaarch.fulfillment.event;

import java.util.UUID;
import com.metaarch.fulfillment.common.AuditedEntity;
import com.metaarch.fulfillment.fulfillment.FulfillmentType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "fulfillment_order_snapshots")
public class FulfillmentOrderSnapshot extends AuditedEntity {
  @Id @Column(name = "order_id", nullable = false) private UUID orderId;
  @Column(name = "customer_id", nullable = false) private UUID customerId;
  @Column(name = "store_id", nullable = false, length = 100) private String storeId;
  @Column(name = "shipping_address_id") private UUID shippingAddressId;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "fulfillment_type", nullable = false, length = 30) private FulfillmentType fulfillmentType = FulfillmentType.SHIP_TO_HOME;
  @Column(nullable = false) private boolean cancelled;

  protected FulfillmentOrderSnapshot() { }

  public FulfillmentOrderSnapshot(UUID orderId, UUID customerId, String storeId) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.storeId = storeId;
  }

  public FulfillmentOrderSnapshot(UUID orderId, UUID customerId, String storeId, UUID shippingAddressId, FulfillmentType fulfillmentType) {
    this(orderId, customerId, storeId);
    this.shippingAddressId = shippingAddressId;
    if (fulfillmentType != null) this.fulfillmentType = fulfillmentType;
  }

  public UUID getOrderId() { return orderId; }
  public UUID getCustomerId() { return customerId; }
  public String getStoreId() { return storeId; }
  public UUID getShippingAddressId() { return shippingAddressId; }
  public FulfillmentType getFulfillmentType() { return fulfillmentType; }
  public boolean isCancelled() { return cancelled; }
  public void setCancelled(boolean cancelled) { this.cancelled = cancelled; }
}
