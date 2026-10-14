package com.metaarch.notification.event;

import java.util.*;
import com.metaarch.notification.notification.*;
import com.metaarch.notification.sender.StaffOrderEmailService;
import org.slf4j.*;
import com.metaarch.sync.EventHandler;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class OrderEventConsumer implements EventHandler {
  public String kind() { return "order"; }
  public String source() { return "order-service"; }
  public void handle(JsonNode payload) { consume(EventHandler.decode(payload, OrderEvent.class)); }

  private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);
  private final NotificationService notificationService;
  private final StaffOrderEmailService staffEmails;

  public OrderEventConsumer(NotificationService notificationService, StaffOrderEmailService staffEmails) {
    this.notificationService = notificationService;
    this.staffEmails = staffEmails;
  }

  public void consume(OrderEvent event) {
    NotificationType type = switch (event.eventType()) {
      case ORDER_CREATED -> NotificationType.ORDER_CREATED;
      case ORDER_STATUS_UPDATED -> NotificationType.ORDER_STATUS_UPDATED;
      case ORDER_CANCELLED -> NotificationType.ORDER_CANCELLED;
    };
    log.info("Creating notification from order event. eventType={}, eventId={}, orderId={}", event.eventType(), event.eventId(), event.orderId());
    notificationService.createFromEvent(event.eventId(), type, NotificationChannel.EMAIL, event.customerId(), event.orderId(), null, values(event));
    if (event.eventType() == OrderEventType.ORDER_CREATED) staffEmails.notifyStaff(event);
  }

  private Map<String, Object> values(OrderEvent event) {
    Map<String, Object> values = new LinkedHashMap<>();
    values.put("eventId", event.eventId());
    values.put("orderId", event.orderId());
    values.put("orderNumber", event.orderNumber());
    values.put("customerId", event.customerId());
    values.put("cartId", event.cartId());
    values.put("storeId", event.storeId());
    values.put("status", event.status());
    values.put("paymentStatus", event.paymentStatus());
    values.put("totalAmount", event.totalAmount());
    values.put("occurredAt", event.occurredAt());
    values.put("deliveryZoneId", event.deliveryZoneId());
    values.put("locationId", event.locationId());
    return values;
  }
}
