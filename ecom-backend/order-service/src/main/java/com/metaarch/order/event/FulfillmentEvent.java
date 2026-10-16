package com.metaarch.order.event;

import java.time.Instant;
import java.util.UUID;

// Fields used to verify the existing fulfillment-service delivery contract.
public record FulfillmentEvent(UUID eventId, String eventType, UUID fulfillmentId, UUID orderId,
    UUID customerId, String storeId, String fulfillmentStatus, UUID shipmentId,
    String shipmentStatus, Instant occurredAt) { }
