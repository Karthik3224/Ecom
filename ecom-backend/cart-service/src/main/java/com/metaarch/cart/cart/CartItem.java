package com.metaarch.cart.cart;

import java.math.*;
import java.util.UUID;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "cart_items")
public class CartItem {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "cart_id", nullable = false) private Cart cart;
  @Column(name = "product_id", nullable = false) private UUID productId;
  @Column(name = "variant_id") private UUID variantId;
  @Column(name = "product_name", nullable = false, length = 255) private String productName;
  @Column(nullable = false) private int quantity;
  @Column(name = "unit_price", nullable = false, precision = 19, scale = 2) private BigDecimal unitPrice;
  @Column(name = "total_price", nullable = false, precision = 19, scale = 2) private BigDecimal totalPrice;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30) private CartItemStatus status = CartItemStatus.ACTIVE;
  protected CartItem() { }
  public CartItem(UUID productId, UUID variantId, String productName, int quantity, BigDecimal unitPrice) { this.productId = productId; this.variantId = variantId; this.productName = productName; this.quantity = quantity; this.unitPrice = unitPrice; recalculateTotal(); }
  public UUID getId() { return id; } public Cart getCart() { return cart; } public void setCart(Cart cart) { this.cart = cart; }
  public UUID getProductId() { return productId; } public UUID getVariantId() { return variantId; } public String getProductName() { return productName; }
  public int getQuantity() { return quantity; } public void setQuantity(int quantity) { this.quantity = quantity; recalculateTotal(); }
  public BigDecimal getUnitPrice() { return unitPrice; } public BigDecimal getTotalPrice() { return totalPrice; }
  public CartItemStatus getStatus() { return status; } public void setStatus(CartItemStatus status) { this.status = status; }
  public void recalculateTotal() { totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP); }
}
