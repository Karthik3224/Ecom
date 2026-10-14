package com.metaarch.inventory.movement;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
  java.util.Optional<StockMovement> findFirstByInventoryIdOrderByCreatedAtDesc(UUID inventoryId);
  Page<StockMovement> findByInventoryId(UUID inventoryId, Pageable pageable);
}
