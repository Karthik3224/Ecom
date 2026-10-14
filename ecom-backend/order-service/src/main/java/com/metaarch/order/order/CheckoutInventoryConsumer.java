package com.metaarch.order.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.metaarch.sync.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name="checkout.multi-store.enabled",havingValue="true")
public class CheckoutInventoryConsumer implements EventHandler {
  private final CheckoutCoordinator coordinator;
  public CheckoutInventoryConsumer(CheckoutCoordinator coordinator){this.coordinator=coordinator;}
  public String kind(){return "checkout-reservation-result";}
  public String source(){return "inventory-service";}
  public void handle(JsonNode payload){coordinator.receive(EventHandler.decode(payload,CheckoutInventoryEvent.class));}
}
