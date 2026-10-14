package com.metaarch.fulfillment.event;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.fulfillment.fulfillment.*;
import com.metaarch.fulfillment.shipment.ShipmentStatus;

public record FulfillmentEvent(
  UUID eventId,
  FulfillmentEventType eventType,
  UUID fulfillmentId,
  UUID orderId,
  UUID customerId,
  String storeId,
  FulfillmentStatus fulfillmentStatus,
  FulfillmentType fulfillmentType,
  UUID shipmentId,
  String carrier,
  String trackingNumber,
  ShipmentStatus shipmentStatus,
  UUID trackingEventId,
  Instant occurredAt
) { }
