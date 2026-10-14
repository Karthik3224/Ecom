package com.metaarch.notification.event;

import java.util.*;
import com.metaarch.notification.notification.*;
import org.slf4j.*;
import com.metaarch.sync.EventHandler;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventConsumer implements EventHandler {
  public String kind() { return "payment"; }
  public String source() { return "payment-service"; }
  public void handle(JsonNode payload) { consume(EventHandler.decode(payload, PaymentEvent.class)); }

  private static final Logger log = LoggerFactory.getLogger(PaymentEventConsumer.class);
  private final NotificationService notificationService;

  public PaymentEventConsumer(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  public void consume(PaymentEvent event) {
    NotificationType type = switch (event.eventType()) {
      case PAYMENT_SUCCESS -> NotificationType.PAYMENT_SUCCESS;
      case PAYMENT_FAILED -> NotificationType.PAYMENT_FAILED;
      case PAYMENT_REFUNDED -> NotificationType.PAYMENT_REFUNDED;
      case PAYMENT_INITIATED -> null;
    };
    if (type == null) {
      log.info("Ignoring unsupported payment event. eventType={}, eventId={}, paymentId={}", event.eventType(), event.eventId(), event.paymentId());
      return;
    }
    log.info("Creating notification from payment event. eventType={}, eventId={}, paymentId={}", event.eventType(), event.eventId(), event.paymentId());
    notificationService.createFromEvent(event.eventId(), type, NotificationChannel.EMAIL, event.customerId(), event.orderId(), null, values(event));
  }

  private Map<String, Object> values(PaymentEvent event) {
    Map<String, Object> values = new LinkedHashMap<>();
    values.put("eventId", event.eventId());
    values.put("paymentId", event.paymentId());
    values.put("orderId", event.orderId());
    values.put("customerId", event.customerId());
    values.put("paymentReference", event.paymentReference());
    values.put("amount", event.amount());
    values.put("currency", event.currency());
    values.put("status", event.status());
    values.put("occurredAt", event.occurredAt());
    return values;
  }
}
