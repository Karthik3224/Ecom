package com.metaarch.order.order;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.order.exception.InvalidOrderStateException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class OrderReviewServiceTest {
  @Mock OrderRepository orders;
  @Mock JdbcTemplate jdbc;

  @ParameterizedTest
  @EnumSource(value = OrderStatus.class, names = "DELIVERED", mode = EnumSource.Mode.EXCLUDE)
  void rejectsReviewUntilOrderIsDelivered(OrderStatus status) {
    UUID orderId = UUID.randomUUID();
    Order order = new Order(UUID.randomUUID(), UUID.randomUUID(), "store", "test-order");
    order.setStatus(status);
    when(orders.findLockedById(orderId)).thenReturn(Optional.of(order));

    OrderReviewService service = new OrderReviewService(orders, jdbc, new ObjectMapper());

    assertThatThrownBy(() -> service.save(orderId, new OrderReviewRequest(5, "Great service", List.of())))
      .isInstanceOf(InvalidOrderStateException.class)
      .hasMessage("A review can be submitted after delivery is complete.");
    verifyNoInteractions(jdbc);
  }

  @Test
  void deliveredOrderSavesReviewForItsPersistedCustomer() {
    UUID orderId = UUID.randomUUID();
    UUID customerId = UUID.randomUUID();
    Order order = new Order(customerId, UUID.randomUUID(), "store", "test-order");
    order.setStatus(OrderStatus.DELIVERED);
    when(orders.findLockedById(orderId)).thenReturn(Optional.of(order));
    OrderReviewResponse response = new OrderReviewResponse(UUID.randomUUID(), orderId, customerId,
      5, "Great service", List.of(), java.time.Instant.now(), java.time.Instant.now());
    OrderReviewService service = spy(new OrderReviewService(orders, jdbc, new ObjectMapper()));
    doReturn(Optional.of(response)).when(service).get(orderId);

    assertThat(service.save(orderId, new OrderReviewRequest(5, " Great service ", List.of()))).isEqualTo(response);
    verify(jdbc).update(anyString(), anyString(), eq(orderId.toString()), eq(customerId.toString()),
      eq(5), eq("Great service"), eq("[]"));
  }
}
