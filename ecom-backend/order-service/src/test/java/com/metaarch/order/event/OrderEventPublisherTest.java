package com.metaarch.order.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.metaarch.order.order.Order;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.metaarch.sync.DurableEvents;

class OrderEventPublisherTest {
  @Test
  void orderCreatedEventCarriesResolvedLocationAndExistingFields() throws Exception {
    DurableEvents events = mock(DurableEvents.class);
    OrderEventPublisher publisher = new OrderEventPublisher(events);
    UUID orderId = UUID.randomUUID();
    UUID customerId = UUID.randomUUID();
    UUID cartId = UUID.randomUUID();
    Order order = new Order(customerId, cartId, "store-1", "ORD-TEST");
    org.springframework.test.util.ReflectionTestUtils.setField(order, "id", orderId);
    order.setLocationId("hyderabad");
    order.setTotalAmount(new BigDecimal("99.00"));

    publisher.publish(OrderEventType.ORDER_CREATED, order);

    var captured = org.mockito.ArgumentCaptor.forClass(Object.class);
    verify(events).publish(any(UUID.class), eq("order"), eq(orderId.toString()), captured.capture());
    OrderEvent event = (OrderEvent) captured.getValue();
    assertThat(event.locationId()).isEqualTo("hyderabad");
    assertThat(event.orderId()).isEqualTo(orderId);
    assertThat(event.customerId()).isEqualTo(customerId);
    assertThat(event.cartId()).isEqualTo(cartId);
    assertThat(event.storeId()).isEqualTo("store-1");
    assertThat(event.orderNumber()).isEqualTo("ORD-TEST");
  }
}
