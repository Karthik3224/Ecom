package com.metaarch.inventory.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InventoryUpdateRequest(@Min(0) int availableQuantity, @Min(0) int reservedQuantity, @Min(0) int reorderLevel, @NotNull InventoryStatus status) {}
