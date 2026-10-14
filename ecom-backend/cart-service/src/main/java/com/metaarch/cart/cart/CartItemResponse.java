package com.metaarch.cart.cart;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemResponse(UUID id, UUID productId, UUID variantId, String productName, int quantity, BigDecimal unitPrice, BigDecimal totalPrice, CartItemStatus status) {
  static CartItemResponse from(CartItem item) { return new CartItemResponse(item.getId(), item.getProductId(), item.getVariantId(), item.getProductName(), item.getQuantity(), item.getUnitPrice(), item.getTotalPrice(), item.getStatus()); }
}
