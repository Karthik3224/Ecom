package com.metaarch.cart.cart;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public record CartResponse(UUID id, UUID customerId, String storeId, CartStatus status, BigDecimal totalAmount, List<CartItemResponse> items, List<CartItemResponse> savedForLaterItems, Instant createdAt, Instant updatedAt) {
  static CartResponse from(Cart cart) { return new CartResponse(cart.getId(), cart.getCustomerId(), cart.getStoreId(), cart.getStatus(), cart.getTotalAmount(), cart.getItems().stream().filter(item -> item.getStatus() == CartItemStatus.ACTIVE).map(CartItemResponse::from).toList(), cart.getItems().stream().filter(item -> item.getStatus() == CartItemStatus.SAVED_FOR_LATER).map(CartItemResponse::from).toList(), cart.getCreatedAt(), cart.getUpdatedAt()); }
}
