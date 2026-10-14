package com.metaarch.cart.cart;

import java.math.BigDecimal;
import java.util.*;
import com.metaarch.cart.common.AuditedEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "carts")
public class Cart extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(name = "customer_id", nullable = false) private UUID customerId;
  @Column(name = "store_id", nullable = false, length = 100) private String storeId;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 20) private CartStatus status;
  @Column(name = "total_amount", nullable = false, precision = 19, scale = 2) private BigDecimal totalAmount = BigDecimal.ZERO;
  @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true) private List<CartItem> items = new ArrayList<>();
  protected Cart() { }
  public Cart(UUID customerId, String storeId) { this.customerId = customerId; this.storeId = storeId; this.status = CartStatus.ACTIVE; }
  public UUID getId() { return id; } public UUID getCustomerId() { return customerId; } public String getStoreId() { return storeId; }
  public CartStatus getStatus() { return status; } public void setStatus(CartStatus status) { this.status = status; }
  public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
  public List<CartItem> getItems() { return items; }
  public void addItem(CartItem item) { item.setCart(this); items.add(item); }
  public void removeItem(CartItem item) { items.remove(item); item.setCart(null); }
  public void clearItems() { items.clear(); }
}
