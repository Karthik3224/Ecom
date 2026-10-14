package com.metaarch.inventory.movement;

import java.time.Instant;
import java.util.UUID;

public record StockMovementResponse(UUID id, UUID inventoryId, int quantity, MovementType movementType, String reason, Instant createdAt) {
  public static StockMovementResponse from(StockMovement v) {
    return new StockMovementResponse(v.getId(), v.getInventory().getId(), v.getQuantity(), v.getMovementType(), v.getReason(), v.getCreatedAt());
  }
}
