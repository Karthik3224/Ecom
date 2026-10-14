package com.metaarch.notification.event;

import java.time.Instant;
import java.util.UUID;

public record FulfillmentEvent(
  UUID eventId,
  FulfillmentEventType eventType,
  UUID fulfillmentId,
  UUID orderId,
  UUID customerId,
  String storeId,
  String fulfillmentStatus,
  String fulfillmentType,
  UUID shipmentId,
  String carrier,
  String trackingNumber,
  String shipmentStatus,
  UUID trackingEventId,
  Instant occurredAt
) { }
