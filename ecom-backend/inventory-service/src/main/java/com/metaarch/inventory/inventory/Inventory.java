package com.metaarch.inventory.inventory;

import java.util.UUID;
import com.metaarch.inventory.common.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "inventories", uniqueConstraints = @UniqueConstraint(name = "uk_inventories_lookup", columnNames = {"product_id", "variant_key", "store_id"}))
public class Inventory extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(name = "product_id", nullable = false) private UUID productId;
  @Column(name = "variant_id") private UUID variantId;
  @Column(name = "variant_key", nullable = false) private UUID variantKey;
  @Column(name = "store_id", nullable = false, length = 100) private String storeId;
  @Column(name = "available_quantity", nullable = false) private int availableQuantity;
  @Column(name = "reserved_quantity", nullable = false) private int reservedQuantity;
  @Column(name = "reorder_level", nullable = false) private int reorderLevel;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 20) private InventoryStatus status = InventoryStatus.ACTIVE;
  @Version private long version;

  protected Inventory() {}
  public Inventory(UUID productId, UUID variantId, String storeId, int availableQuantity, int reservedQuantity, int reorderLevel, InventoryStatus status) {
    this.productId = productId; setVariantId(variantId); this.storeId = storeId; this.availableQuantity = availableQuantity; this.reservedQuantity = reservedQuantity; this.reorderLevel = reorderLevel; this.status = status;
  }
  public UUID getId() { return id; }
  public UUID getProductId() { return productId; }
  public void setProductId(UUID productId) { this.productId = productId; }
  public UUID getVariantId() { return variantId; }
  public void setVariantId(UUID variantId) { this.variantId = variantId; this.variantKey = variantId == null ? new UUID(0L, 0L) : variantId; }
  public UUID getVariantKey() { return variantKey; }
  public String getStoreId() { return storeId; }
  public void setStoreId(String storeId) { this.storeId = storeId; }
  public int getAvailableQuantity() { return availableQuantity; }
  public void setAvailableQuantity(int availableQuantity) { this.availableQuantity = availableQuantity; }
  public int getReservedQuantity() { return reservedQuantity; }
  public void setReservedQuantity(int reservedQuantity) { this.reservedQuantity = reservedQuantity; }
  public int getReorderLevel() { return reorderLevel; }
  public void setReorderLevel(int reorderLevel) { this.reorderLevel = reorderLevel; }
  public InventoryStatus getStatus() { return status; }
  public void setStatus(InventoryStatus status) { this.status = status; }
  public long getVersion() { return version; }
}
