package com.metaarch.inventory.reservation;

import com.fasterxml.jackson.databind.JsonNode;
import com.metaarch.sync.*;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class CheckoutReservationConsumer implements EventHandler {
  private final CheckoutReservations reservations;
  private final DurableEvents events;
  public CheckoutReservationConsumer(CheckoutReservations reservations,DurableEvents events) { this.reservations=reservations; this.events=events; }
  public String kind() { return "checkout-reservation"; }
  public String source() { return "order-service"; }
  public void handle(JsonNode payload) {
    var command=EventHandler.decode(payload,CheckoutInventoryEvent.class);
    String state=reservations.apply(command);
    reservations.resumeReplies(command);
    UUID eventId=UUID.randomUUID();
    events.publish(eventId,"checkout-reservation-result",command.orderId().toString(),
        new CheckoutInventoryEvent(eventId,command.orderId(),command.customerId(),command.childId(),command.storeId(),command.action(),command.lines(),state));
  }
}
