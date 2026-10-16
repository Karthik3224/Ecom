package com.metaarch.order.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.metaarch.order.order.OrderService;
import com.metaarch.sync.EventHandler;
import org.springframework.stereotype.Component;

@Component
public class FulfillmentEventConsumer implements EventHandler {
  private final OrderService orders;
  public FulfillmentEventConsumer(OrderService orders) { this.orders = orders; }
  public String kind() { return "fulfillment"; }
  public String source() { return "fulfillment-service"; }
  public void handle(JsonNode payload) {
    FulfillmentEvent event = EventHandler.decode(payload, FulfillmentEvent.class);
    if (event.eventId() == null || event.orderId() == null || event.eventType() == null)
      throw new IllegalArgumentException("Invalid fulfillment event");
    // Creation, tracking and intermediate fulfillment events do not prove delivery.
    if ("SHIPMENT_DELIVERED".equals(event.eventType())) orders.applyVerifiedDelivery(event);
  }
}
