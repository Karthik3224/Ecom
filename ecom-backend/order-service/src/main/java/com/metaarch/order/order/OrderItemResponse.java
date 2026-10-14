package com.metaarch.order.order;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(UUID id, UUID orderId, UUID productId, UUID variantId, String productName, int quantity, BigDecimal unitPrice, BigDecimal totalPrice) {
  static OrderItemResponse from(OrderItem item) {
    return new OrderItemResponse(item.getId(), item.getOrderId(), item.getProductId(), item.getVariantId(), item.getProductName(), item.getQuantity(), item.getUnitPrice(), item.getTotalPrice());
  }
}
