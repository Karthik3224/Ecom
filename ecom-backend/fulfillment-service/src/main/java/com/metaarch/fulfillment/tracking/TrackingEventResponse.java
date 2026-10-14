package com.metaarch.fulfillment.tracking;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.fulfillment.shipment.ShipmentStatus;

public record TrackingEventResponse(UUID id, UUID shipmentId, ShipmentStatus status, String location, String description, Instant eventTime, Instant createdAt) {
  public static TrackingEventResponse from(TrackingEvent event) {
    return new TrackingEventResponse(event.getId(), event.getShipmentId(), event.getStatus(), event.getLocation(), event.getDescription(), event.getEventTime(), event.getCreatedAt());
  }
}
