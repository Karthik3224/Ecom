package com.metaarch.order.order;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.order.exception.InvalidOrderStateException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class OrderReviewServiceTest {
  @Mock OrderRepository orders;
  @Mock JdbcTemplate jdbc;

  @Test
  void rejectsReviewUntilOrderIsDelivered() {
    UUID orderId = UUID.randomUUID();
    Order order = mock(Order.class);
    when(order.getStatus()).thenReturn(OrderStatus.CREATED);
    when(orders.findLockedById(orderId)).thenReturn(Optional.of(order));

    OrderReviewService service = new OrderReviewService(orders, jdbc, new ObjectMapper());

    assertThatThrownBy(() -> service.save(orderId, new OrderReviewRequest(5, "Great service", List.of())))
      .isInstanceOf(InvalidOrderStateException.class)
      .hasMessage("A review can be submitted after delivery is complete.");
    verifyNoInteractions(jdbc);
  }
}
