package com.metaarch.inventory.inventory;

import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InventoryRequest(@NotNull UUID productId, UUID variantId, @NotBlank @Size(max = 100) String storeId, @Min(0) int availableQuantity, @Min(0) int reservedQuantity, @Min(0) int reorderLevel, @NotNull InventoryStatus status) {}
