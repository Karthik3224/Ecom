package com.metaarch.inventory.inventory;

import java.time.Instant;
import java.util.UUID;

public record InventoryResponse(UUID id, UUID productId, UUID variantId, String storeId, int availableQuantity, int reservedQuantity, int reorderLevel, InventoryStatus status, long version, Instant createdAt, Instant updatedAt) {
  public static InventoryResponse from(Inventory v) {
    return new InventoryResponse(v.getId(), v.getProductId(), v.getVariantId(), v.getStoreId(), v.getAvailableQuantity(), v.getReservedQuantity(), v.getReorderLevel(), v.getStatus(), v.getVersion(), v.getCreatedAt(), v.getUpdatedAt());
  }
}
