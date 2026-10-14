package com.metaarch.order.event;

import com.metaarch.order.order.OrderService;
import com.metaarch.sync.EventHandler;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventConsumer implements EventHandler {
  public String kind() { return "payment"; }
  public String source() { return "payment-service"; }
  public void handle(JsonNode payload) { consume(EventHandler.decode(payload, PaymentEvent.class)); }

  private final OrderService orders;

  public PaymentEventConsumer(OrderService orders) {
    this.orders = orders;
  }

  public void consume(PaymentEvent event) {
    if (event.orderId() == null || event.status() == null || event.eventType() == null) throw new IllegalArgumentException("Invalid payment event");
    orders.applyVerifiedPayment(event);
  }
}
