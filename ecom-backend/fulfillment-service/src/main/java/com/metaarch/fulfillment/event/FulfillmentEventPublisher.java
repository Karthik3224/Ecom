package com.metaarch.fulfillment.event;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.fulfillment.fulfillment.Fulfillment;
import com.metaarch.fulfillment.shipment.Shipment;
import com.metaarch.fulfillment.tracking.TrackingEvent;
import com.metaarch.sync.DurableEvents;
import org.springframework.stereotype.Component;

@Component
public class FulfillmentEventPublisher {
  private final DurableEvents events;
  public FulfillmentEventPublisher(DurableEvents events) { this.events = events; }
  public void publish(FulfillmentEventType type, Fulfillment fulfillment, Shipment shipment, TrackingEvent tracking) {
    var event = new FulfillmentEvent(UUID.randomUUID(), type, fulfillment.getId(), fulfillment.getOrderId(),
      fulfillment.getCustomerId(), fulfillment.getStoreId(), fulfillment.getStatus(), fulfillment.getFulfillmentType(),
      shipment == null ? null : shipment.getId(), shipment == null ? null : shipment.getCarrier(),
      shipment == null ? null : shipment.getTrackingNumber(), shipment == null ? null : shipment.getStatus(),
      tracking == null ? null : tracking.getId(), Instant.now());
    events.publish(event.eventId(), "fulfillment", fulfillment.getOrderId().toString(), event);
  }
}
