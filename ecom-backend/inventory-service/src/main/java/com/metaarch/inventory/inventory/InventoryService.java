package com.metaarch.inventory.inventory;

import java.util.UUID;
import com.metaarch.inventory.common.PageResponse;
import com.metaarch.inventory.exception.ConflictException;
import com.metaarch.inventory.exception.ResourceNotFoundException;
import com.metaarch.inventory.movement.MovementType;
import com.metaarch.inventory.movement.StockMovementRecorder;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

@Service
public class InventoryService {
  private static final UUID NO_VARIANT = new UUID(0L, 0L);
  private final InventoryRepository inventories;
  private final StockMovementRecorder movements;
  private final org.springframework.jdbc.core.JdbcTemplate jdbc;
  public InventoryService(InventoryRepository inventories, StockMovementRecorder movements,org.springframework.jdbc.core.JdbcTemplate jdbc) { this.inventories = inventories; this.movements = movements; this.jdbc=jdbc; }

  @PostConstruct
  void ensureGlobalAfghanRaisinsStock() {
    UUID productId = UUID.fromString("21000000-0000-0000-0000-000000000008");
    UUID variantId = UUID.fromString("c88ea8c7-c3cf-11f1-860d-14cb19888cfa");
    if (!inventories.existsByProductIdAndVariantKeyAndStoreId(productId, variantId, "global-store")) {
      inventories.save(new Inventory(productId, variantId, "global-store", 100, 0, 10, InventoryStatus.ACTIVE));
    }
  }

  @Transactional public InventoryResponse create(InventoryRequest r) {
    validateQuantities(r.availableQuantity(), r.reservedQuantity());
    UUID variantKey = variantKey(r.variantId());
    String storeId = clean(r.storeId());
    if (inventories.existsByProductIdAndVariantKeyAndStoreId(r.productId(), variantKey, storeId)) throw new ConflictException("Inventory already exists for product, variant and store");
    Inventory inventory = new Inventory(r.productId(), r.variantId(), storeId, r.availableQuantity(), r.reservedQuantity(), r.reorderLevel(), normalizedStatus(r.status(), r.availableQuantity()));
    return InventoryResponse.from(inventories.save(inventory));
  }

  @Transactional public InventoryResponse update(UUID id, InventoryUpdateRequest r) {
    Inventory inventory = findForUpdate(id);
    validateQuantities(r.availableQuantity(), r.reservedQuantity());
    int previousAvailable = inventory.getAvailableQuantity();
    if(checkoutReserved(id)>0 && (r.availableQuantity()!=previousAvailable || r.reservedQuantity()!=inventory.getReservedQuantity())) throw new ConflictException("Checkout-held inventory requires reservation transitions");
    inventory.setAvailableQuantity(r.availableQuantity());
    inventory.setReservedQuantity(r.reservedQuantity());
    inventory.setReorderLevel(r.reorderLevel());
    inventory.setStatus(normalizedStatus(r.status(), r.availableQuantity()));
    int delta = r.availableQuantity() - previousAvailable;
    if (delta != 0) movements.record(inventory, Math.abs(delta), MovementType.ADJUST, "Manual inventory adjustment");
    return InventoryResponse.from(inventory);
  }

  @Transactional(readOnly = true) public InventoryResponse get(UUID id) { return InventoryResponse.from(find(id)); }

  @Transactional(readOnly = true) public InventoryResponse getByLookup(UUID productId, UUID variantId, String storeId) {
    return inventories.findByProductIdAndVariantKeyAndStoreId(productId, variantKey(variantId), clean(storeId)).map(InventoryResponse::from).orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product, variant and store"));
  }

  @Transactional(readOnly = true) public PageResponse<InventoryResponse> list(String storeId, InventoryStatus status, Pageable pageable) {
    if (storeId == null || storeId.isBlank()) {
      return PageResponse.from(status == null ? inventories.findAll(pageable) : inventories.findByStatus(status, pageable), InventoryResponse::from);
    }
    String cleanStoreId = clean(storeId);
    return PageResponse.from(status == null ? inventories.findByStoreId(cleanStoreId, pageable) : inventories.findByStoreIdAndStatus(cleanStoreId, status, pageable), InventoryResponse::from);
  }

  @Transactional(readOnly = true) public Inventory find(UUID id) {
    return inventories.findById(id).orElseThrow(() -> new ResourceNotFoundException("Inventory not found: " + id));
  }

  public Inventory findForUpdate(UUID id) {
    return inventories.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Inventory not found: " + id));
  }

  public int checkoutReserved(UUID id) {
    byte[] binary=java.nio.ByteBuffer.allocate(16).putLong(id.getMostSignificantBits()).putLong(id.getLeastSignificantBits()).array();
    return jdbc.queryForObject("SELECT COALESCE(SUM(l.quantity),0) FROM checkout_reservation_lines l JOIN checkout_reservations r ON r.child_id=l.child_id WHERE l.inventory_id=? AND r.state='RESERVED'",Integer.class,binary);
  }

  static UUID variantKey(UUID variantId) { return variantId == null ? NO_VARIANT : variantId; }
  private void validateQuantities(int available, int reserved) { if (available < 0 || reserved < 0) throw new IllegalArgumentException("Inventory quantities cannot be negative"); }
  private InventoryStatus normalizedStatus(InventoryStatus requested, int available) { return requested == InventoryStatus.ACTIVE && available == 0 ? InventoryStatus.OUT_OF_STOCK : requested; }
  private String clean(String v) { return v.trim(); }
}
