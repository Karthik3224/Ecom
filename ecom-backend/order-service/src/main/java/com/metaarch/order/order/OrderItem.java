package com.metaarch.order.order;

import java.math.*;
import java.util.UUID;
import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false) private Order order;
  @Column(name = "product_id", nullable = false) private UUID productId;
  @Column(name = "variant_id") private UUID variantId;
  @Column(name = "product_name", nullable = false, length = 255) private String productName;
  @Column(nullable = false) private int quantity;
  @Column(name = "unit_price", nullable = false, precision = 19, scale = 2) private BigDecimal unitPrice;
  @Column(name = "total_price", nullable = false, precision = 19, scale = 2) private BigDecimal totalPrice;

  protected OrderItem() { }

  public OrderItem(UUID productId, UUID variantId, String productName, int quantity, BigDecimal unitPrice) {
    this.productId = productId;
    this.variantId = variantId;
    this.productName = productName;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    recalculateTotal();
  }

  public UUID getId() { return id; }
  public Order getOrder() { return order; }
  public void setOrder(Order order) { this.order = order; }
  public UUID getOrderId() { return order == null ? null : order.getId(); }
  public UUID getProductId() { return productId; }
  public UUID getVariantId() { return variantId; }
  public String getProductName() { return productName; }
  public int getQuantity() { return quantity; }
  public BigDecimal getUnitPrice() { return unitPrice; }
  public BigDecimal getTotalPrice() { return totalPrice; }
  public void recalculateTotal() { totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP); }
}
