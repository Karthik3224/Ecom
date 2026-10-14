package com.metaarch.inventory.movement;

import java.util.UUID;
import com.metaarch.inventory.exception.InsufficientStockException;
import com.metaarch.inventory.inventory.Inventory;
import com.metaarch.inventory.inventory.InventoryResponse;
import com.metaarch.inventory.inventory.InventoryService;
import com.metaarch.inventory.inventory.InventoryStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockService {
  private final InventoryService inventories;
  private final StockMovementRecorder movements;
  public StockService(InventoryService inventories, StockMovementRecorder movements) { this.inventories = inventories; this.movements = movements; }

  @Transactional public InventoryResponse increase(UUID inventoryId, StockAdjustmentRequest r) {
    Inventory inventory = inventories.findForUpdate(inventoryId);
    inventory.setAvailableQuantity(inventory.getAvailableQuantity() + r.quantity());
    activateIfStocked(inventory);
    record(inventory, r.quantity(), MovementType.INCREASE, r.reason());
    return InventoryResponse.from(inventory);
  }

  @Transactional public InventoryResponse decrease(UUID inventoryId, StockAdjustmentRequest r) {
    Inventory inventory = inventories.findForUpdate(inventoryId);
    requireAvailable(inventory, r.quantity());
    inventory.setAvailableQuantity(inventory.getAvailableQuantity() - r.quantity());
    syncStockStatus(inventory);
    record(inventory, r.quantity(), MovementType.DECREASE, r.reason());
    return InventoryResponse.from(inventory);
  }

  @Transactional public InventoryResponse reserve(UUID inventoryId, StockAdjustmentRequest r) {
    Inventory inventory = inventories.findForUpdate(inventoryId);
    requireAvailable(inventory, r.quantity());
    inventory.setAvailableQuantity(inventory.getAvailableQuantity() - r.quantity());
    inventory.setReservedQuantity(inventory.getReservedQuantity() + r.quantity());
    syncStockStatus(inventory);
    record(inventory, r.quantity(), MovementType.RESERVE, r.reason());
    return InventoryResponse.from(inventory);
  }

  @Transactional public InventoryResponse release(UUID inventoryId, StockAdjustmentRequest r) {
    Inventory inventory = inventories.findForUpdate(inventoryId);
    if (inventory.getReservedQuantity() < r.quantity()) throw new InsufficientStockException("Insufficient reserved stock");
    if (inventory.getReservedQuantity()-inventories.checkoutReserved(inventoryId)<r.quantity()) throw new InsufficientStockException("Checkout reservations cannot be released through manual stock operations");
    inventory.setReservedQuantity(inventory.getReservedQuantity() - r.quantity());
    inventory.setAvailableQuantity(inventory.getAvailableQuantity() + r.quantity());
    activateIfStocked(inventory);
    record(inventory, r.quantity(), MovementType.RELEASE, r.reason());
    return InventoryResponse.from(inventory);
  }

  private void requireAvailable(Inventory inventory, int quantity) {
    if (inventory.getStatus() == InventoryStatus.INACTIVE) throw new InsufficientStockException("Inventory is inactive");
    if (inventory.getAvailableQuantity() < quantity) throw new InsufficientStockException("Insufficient available stock");
  }
  private void record(Inventory inventory, int quantity, MovementType type, String reason) { movements.record(inventory, quantity, type, reason); }
  private void activateIfStocked(Inventory inventory) { if (inventory.getStatus() == InventoryStatus.OUT_OF_STOCK && inventory.getAvailableQuantity() > 0) inventory.setStatus(InventoryStatus.ACTIVE); }
  private void syncStockStatus(Inventory inventory) { if (inventory.getStatus() == InventoryStatus.ACTIVE && inventory.getAvailableQuantity() == 0) inventory.setStatus(InventoryStatus.OUT_OF_STOCK); }
}
