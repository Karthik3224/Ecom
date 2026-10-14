package com.metaarch.fulfillment.event;

import com.metaarch.fulfillment.fulfillment.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentEventConsumerTest {
  @Test void missingOrderSnapshotFailsForDurableRetryInsteadOfDiscardingPayment() {
    var snapshots = mock(FulfillmentOrderSnapshotRepository.class);
    var repository = mock(FulfillmentRepository.class);
    var service = mock(FulfillmentService.class);
    UUID orderId = UUID.randomUUID();
    when(snapshots.findById(orderId)).thenReturn(Optional.empty());
    var consumer = new PaymentEventConsumer(snapshots, repository, service);
    var event = new PaymentEvent(UUID.randomUUID(), PaymentEventType.PAYMENT_SUCCESS, UUID.randomUUID(), orderId,
      UUID.randomUUID(), "ref", BigDecimal.TEN, "INR", PaymentStatus.SUCCESS, Instant.now());
    assertThatThrownBy(() -> consumer.consume(event)).isInstanceOf(IllegalStateException.class);
    verifyNoInteractions(service);
  }
}
