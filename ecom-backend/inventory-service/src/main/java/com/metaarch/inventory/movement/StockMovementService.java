package com.metaarch.inventory.movement;

import java.util.UUID;
import com.metaarch.inventory.common.PageResponse;
import com.metaarch.inventory.inventory.InventoryService;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovementService {
  private final InventoryService inventories;
  private final StockMovementRepository movements;
  public StockMovementService(InventoryService inventories, StockMovementRepository movements) { this.inventories = inventories; this.movements = movements; }

  @Transactional(readOnly = true) public PageResponse<StockMovementResponse> list(UUID inventoryId, Pageable pageable) {
    inventories.find(inventoryId);
    return PageResponse.from(movements.findByInventoryId(inventoryId, pageable), StockMovementResponse::from);
  }
}
