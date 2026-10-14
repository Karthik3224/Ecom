package com.metaarch.sync;

import java.util.List;
import java.util.UUID;

public record CheckoutInventoryEvent(UUID eventId, UUID orderId, UUID customerId,
    UUID childId, String storeId, String action, List<Line> lines, String state) {
  public record Line(UUID productId, UUID variantId, int quantity) { }
}
