package com.metaarch.catalog.variant;
import java.math.BigDecimal; import java.util.UUID; import com.metaarch.catalog.common.AuditedEntity; import com.metaarch.catalog.product.Product; import jakarta.persistence.*;
@Entity @Table(name="product_variants",uniqueConstraints=@UniqueConstraint(name="uk_product_variants_sku",columnNames="sku"))
public class ProductVariant extends AuditedEntity {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id; @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="product_id",nullable=false) private Product product;
 @Column(nullable=false,length=100) private String sku; @Column(nullable=false,length=180) private String name; @Column(columnDefinition="JSON") private String attributes;
 @Column(nullable=false,precision=19,scale=2) private BigDecimal price; @Column(name="compare_at_price",precision=19,scale=2) private BigDecimal compareAtPrice; @Column(nullable=false) private boolean active=true;
 protected ProductVariant(){} public ProductVariant(Product p,String s,String n,BigDecimal v){product=p;sku=s;name=n;price=v;}
 public UUID getId(){return id;} public Product getProduct(){return product;} public String getSku(){return sku;} public void setSku(String v){sku=v;} public String getName(){return name;} public void setName(String v){name=v;}
 public String getAttributes(){return attributes;} public void setAttributes(String v){attributes=v;} public BigDecimal getPrice(){return price;} public void setPrice(BigDecimal v){price=v;}
 public BigDecimal getCompareAtPrice(){return compareAtPrice;} public void setCompareAtPrice(BigDecimal v){compareAtPrice=v;} public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
}
