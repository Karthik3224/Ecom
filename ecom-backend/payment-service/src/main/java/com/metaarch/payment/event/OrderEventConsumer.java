package com.metaarch.payment.event;

import com.metaarch.payment.payment.PaymentService;
import com.metaarch.sync.EventHandler;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class OrderEventConsumer implements EventHandler {
  public String kind() { return "order"; }
  public String source() { return "order-service"; }
  public void handle(JsonNode payload) { consume(EventHandler.decode(payload, OrderEvent.class)); }

  private final PaymentService paymentService;

  public OrderEventConsumer(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  public void consume(OrderEvent event) {
    if (event.eventType() == OrderEventType.ORDER_CREATED) {
      paymentService.createPendingPaymentFromOrder(event);
    } else if (event.eventType() == OrderEventType.ORDER_CANCELLED) {
      paymentService.refundSuccessfulPaymentForCancelledOrder(event.orderId());
    }
  }
}
