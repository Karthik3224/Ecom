package com.metaarch.inventory.movement;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import com.metaarch.inventory.inventory.Inventory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovementRecorder {
  private final StockMovementRepository movements;
  public StockMovementRecorder(StockMovementRepository movements) { this.movements = movements; }

  // Callers hold the inventory row lock; persisted history survives clock rollback and restart.
  @Transactional(propagation = Propagation.MANDATORY)
  public void record(Inventory inventory, int quantity, MovementType type, String reason) {
    Instant previous = movements.findFirstByInventoryIdOrderByCreatedAtDesc(inventory.getId())
      .map(StockMovement::getCreatedAt).orElse(null);
    movements.save(new StockMovement(inventory, quantity, type, reason.trim(), nextTimestamp(Instant.now(), previous)));
  }

  static Instant nextTimestamp(Instant now, Instant previous) {
    Instant candidate = now.truncatedTo(ChronoUnit.MICROS);
    return previous != null && !candidate.isAfter(previous)
      ? previous.truncatedTo(ChronoUnit.MICROS).plus(1, ChronoUnit.MICROS) : candidate;
  }
}
