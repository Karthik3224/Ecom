package com.metaarch.fulfillment.event;

import com.metaarch.fulfillment.fulfillment.FulfillmentService;
import com.metaarch.sync.EventHandler;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrderEventConsumer implements EventHandler {
  public String kind() { return "order"; }
  public String source() { return "order-service"; }
  public void handle(JsonNode payload) { consume(EventHandler.decode(payload, OrderEvent.class)); }

  private final FulfillmentOrderSnapshotRepository snapshots;
  private final FulfillmentService fulfillments;

  public OrderEventConsumer(FulfillmentOrderSnapshotRepository snapshots, FulfillmentService fulfillments) {
    this.snapshots = snapshots;
    this.fulfillments = fulfillments;
  }

  @Transactional
  public void consume(OrderEvent event) {
    if (event.eventType() == OrderEventType.ORDER_CREATED && event.orderId() != null && event.customerId() != null && event.storeId() != null) {
      snapshots.save(new FulfillmentOrderSnapshot(event.orderId(), event.customerId(), event.storeId(), event.shippingAddressId(), fulfillmentType(event.fulfillmentType(), event.storeId())));
    } else if (event.eventType() == OrderEventType.ORDER_CANCELLED && event.orderId() != null) {
      snapshots.findById(event.orderId()).ifPresent(snapshot -> snapshot.setCancelled(true));
      fulfillments.cancelByOrderIfAllowed(event.orderId());
    }
  }

  private com.metaarch.fulfillment.fulfillment.FulfillmentType fulfillmentType(String value, String storeId) {
    String normalized = value == null ? "" : value.trim().toLowerCase(java.util.Locale.ROOT);
    if ("global".equals(normalized) || "india_wide".equals(normalized) || "global-store".equalsIgnoreCase(storeId)) return com.metaarch.fulfillment.fulfillment.FulfillmentType.GLOBAL;
    if ("pickup".equals(normalized) || "store_pickup".equals(normalized) || "store-pickup".equals(normalized)) return com.metaarch.fulfillment.fulfillment.FulfillmentType.STORE_PICKUP;
    return com.metaarch.fulfillment.fulfillment.FulfillmentType.SHIP_TO_HOME;
  }
}
