package com.metaarch.order.event;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.order.order.Order;
import com.metaarch.sync.DurableEvents;
import org.springframework.stereotype.Component;

@Component
public class OrderEventPublisher {
  private final DurableEvents events;
  public OrderEventPublisher(DurableEvents events) { this.events = events; }
  public void publish(OrderEventType type, Order order) {
    var event = new OrderEvent(UUID.randomUUID(), type, order.getId(), order.getOrderNumber(),
      order.getCustomerId(), order.getCartId(), order.getStoreId(), order.getShippingAddressId(),
      order.getFulfillmentType(), order.getStatus(), order.getPaymentStatus(), order.getTotalAmount(),
      Instant.now(), order.getLocationId());
    events.publish(event.eventId(), "order", order.getId().toString(), event);
  }
}
