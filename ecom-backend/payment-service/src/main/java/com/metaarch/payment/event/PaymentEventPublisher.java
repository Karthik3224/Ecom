package com.metaarch.payment.event;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.payment.payment.Payment;
import com.metaarch.sync.DurableEvents;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventPublisher {
  private final DurableEvents events;
  public PaymentEventPublisher(DurableEvents events) { this.events = events; }
  public void publish(PaymentEventType type, Payment payment) {
    var event = new PaymentEvent(UUID.randomUUID(), type, payment.getId(), payment.getOrderId(),
      payment.getCustomerId(), payment.getPaymentReference(), payment.getAmount(), payment.getCurrency(),
      payment.getStatus(), Instant.now());
    events.publish(event.eventId(), "payment", payment.getOrderId().toString(), event);
  }
}
