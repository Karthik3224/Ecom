package com.metaarch.inventory.movement;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.inventory.inventory.Inventory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "stock_movements")
public class StockMovement {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "inventory_id", nullable = false) private Inventory inventory;
  @Column(nullable = false) private int quantity;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "movement_type", nullable = false, length = 20) private MovementType movementType;
  @Column(nullable = false, length = 500) private String reason;
  @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

  protected StockMovement() {}
  public StockMovement(Inventory inventory, int quantity, MovementType movementType, String reason) { this.inventory = inventory; this.quantity = quantity; this.movementType = movementType; this.reason = reason; }
  public StockMovement(Inventory inventory, int quantity, MovementType movementType, String reason, Instant createdAt) {
    this(inventory, quantity, movementType, reason);
    this.createdAt = createdAt;
  }
  @PrePersist void prePersist() { if (createdAt == null) createdAt = Instant.now(); }
  public UUID getId() { return id; }
  public Inventory getInventory() { return inventory; }
  public int getQuantity() { return quantity; }
  public MovementType getMovementType() { return movementType; }
  public String getReason() { return reason; }
  public Instant getCreatedAt() { return createdAt; }
}
