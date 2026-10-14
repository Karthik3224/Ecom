package com.metaarch.inventory.movement;

import java.util.UUID;
import com.metaarch.inventory.common.PageResponse;
import com.metaarch.inventory.inventory.InventoryResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@org.springframework.security.access.prepost.PreAuthorize("T(com.metaarch.sync.PublicApiSecurity).administrator()")
public class StockController {
  private final StockService stock;
  private final StockMovementService movements;
  public StockController(StockService stock, StockMovementService movements) { this.stock = stock; this.movements = movements; }

  @PostMapping("/api/v1/inventories/{id}/stock/increase") InventoryResponse increase(@PathVariable UUID id, @Valid @RequestBody StockAdjustmentRequest r) { return stock.increase(id, r); }
  @PostMapping("/api/v1/inventories/{id}/stock/decrease") InventoryResponse decrease(@PathVariable UUID id, @Valid @RequestBody StockAdjustmentRequest r) { return stock.decrease(id, r); }
  @PostMapping("/api/v1/inventories/{id}/stock/reserve") InventoryResponse reserve(@PathVariable UUID id, @Valid @RequestBody StockAdjustmentRequest r) { return stock.reserve(id, r); }
  @PostMapping("/api/v1/inventories/{id}/stock/release") InventoryResponse release(@PathVariable UUID id, @Valid @RequestBody StockAdjustmentRequest r) { return stock.release(id, r); }
  @GetMapping("/api/v1/inventories/{id}/movements") PageResponse<StockMovementResponse> movements(@PathVariable UUID id, @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) { return movements.list(id, pageable); }
}
