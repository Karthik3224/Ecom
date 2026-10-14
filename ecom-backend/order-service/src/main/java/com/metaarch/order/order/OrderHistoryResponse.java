package com.metaarch.order.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderHistoryResponse(UUID id, String orderNumber, String storeId, OrderStatus status, BigDecimal totalAmount, PaymentStatus paymentStatus, Instant createdAt, Instant updatedAt) {
  static OrderHistoryResponse from(Order order) {
    return new OrderHistoryResponse(order.getId(), order.getOrderNumber(), order.getStoreId(), order.getStatus(), order.getTotalAmount(), order.getPaymentStatus(), order.getCreatedAt(), order.getUpdatedAt());
  }
}
