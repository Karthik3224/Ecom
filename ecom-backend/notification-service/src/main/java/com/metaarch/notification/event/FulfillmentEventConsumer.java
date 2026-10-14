package com.metaarch.notification.event;

import java.util.*;
import com.metaarch.notification.notification.*;
import org.slf4j.*;
import com.metaarch.sync.EventHandler;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class FulfillmentEventConsumer implements EventHandler {
  public String kind() { return "fulfillment"; }
  public String source() { return "fulfillment-service"; }
  public void handle(JsonNode payload) { consume(EventHandler.decode(payload, FulfillmentEvent.class)); }

  private static final Logger log = LoggerFactory.getLogger(FulfillmentEventConsumer.class);
  private final NotificationService notificationService;

  public FulfillmentEventConsumer(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  public void consume(FulfillmentEvent event) {
    NotificationType type = switch (event.eventType()) {
      case FULFILLMENT_CREATED -> NotificationType.FULFILLMENT_CREATED;
      case SHIPMENT_CREATED -> NotificationType.SHIPMENT_CREATED;
      case SHIPMENT_DELIVERED -> NotificationType.SHIPMENT_DELIVERED;
      case FULFILLMENT_STATUS_UPDATED, SHIPMENT_STATUS_UPDATED, TRACKING_EVENT_ADDED -> null;
    };
    if (type == null) {
      log.info("Ignoring unsupported fulfillment event. eventType={}, eventId={}, fulfillmentId={}", event.eventType(), event.eventId(), event.fulfillmentId());
      return;
    }
    log.info("Creating notification from fulfillment event. eventType={}, eventId={}, fulfillmentId={}", event.eventType(), event.eventId(), event.fulfillmentId());
    notificationService.createFromEvent(event.eventId(), type, NotificationChannel.EMAIL, event.customerId(), event.orderId(), null, values(event));
  }

  private Map<String, Object> values(FulfillmentEvent event) {
    Map<String, Object> values = new LinkedHashMap<>();
    values.put("eventId", event.eventId());
    values.put("fulfillmentId", event.fulfillmentId());
    values.put("orderId", event.orderId());
    values.put("customerId", event.customerId());
    values.put("storeId", event.storeId());
    values.put("fulfillmentStatus", event.fulfillmentStatus());
    values.put("fulfillmentType", event.fulfillmentType());
    values.put("shipmentId", event.shipmentId());
    values.put("carrier", event.carrier());
    values.put("trackingNumber", event.trackingNumber());
    values.put("shipmentStatus", event.shipmentStatus());
    values.put("trackingEventId", event.trackingEventId());
    values.put("status", event.shipmentStatus() == null ? event.fulfillmentStatus() : event.shipmentStatus());
    values.put("occurredAt", event.occurredAt());
    return values;
  }
}
