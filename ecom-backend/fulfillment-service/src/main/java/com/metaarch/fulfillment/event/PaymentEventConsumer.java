package com.metaarch.fulfillment.event;

import com.metaarch.fulfillment.fulfillment.*;
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
  private final FulfillmentOrderSnapshotRepository snapshots;
  private final FulfillmentRepository fulfillmentRepository;
  private final FulfillmentService fulfillments;

  public PaymentEventConsumer(FulfillmentOrderSnapshotRepository snapshots, FulfillmentRepository fulfillmentRepository, FulfillmentService fulfillments) {
    this.snapshots = snapshots;
    this.fulfillmentRepository = fulfillmentRepository;
    this.fulfillments = fulfillments;
  }

  public void consume(PaymentEvent event) {
    if (event.eventType() != PaymentEventType.PAYMENT_SUCCESS || event.orderId() == null) return;
    if (fulfillmentRepository.existsByOrderId(event.orderId())) return;
    snapshots.findById(event.orderId()).ifPresentOrElse(snapshot -> {
      if (snapshot.isCancelled()) return;
      if (snapshot.getShippingAddressId() == null && snapshot.getFulfillmentType() == FulfillmentType.SHIP_TO_HOME) {
        log.warn("Cannot create fulfillment from PAYMENT_SUCCESS because shippingAddressId is missing. orderId={}", event.orderId());
        throw new IllegalStateException("Shipping address is not available yet");
      }
      fulfillments.createEntity(new CreateFulfillmentRequest(snapshot.getOrderId(), snapshot.getCustomerId(), snapshot.getStoreId(), snapshot.getShippingAddressId(), snapshot.getFulfillmentType()));
    }, () -> { throw new IllegalStateException("Order snapshot is not available yet"); });
  }
}
