package com.metaarch.catalog.storeproduct;
import java.math.BigDecimal; import java.util.UUID; import com.metaarch.catalog.common.AuditedEntity; import com.metaarch.catalog.product.Product; import jakarta.persistence.*;
@Entity @Table(name="store_products",uniqueConstraints=@UniqueConstraint(name="uk_store_products_store_product",columnNames={"store_id","product_id"})) public class StoreProduct extends AuditedEntity {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id; @Column(name="store_id",nullable=false,length=100) private String storeId; @Column(name="store_name",length=180) private String storeName; @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="product_id",nullable=false) private Product product;
 @Column(nullable=false) private boolean available=true; @Column(name="price_override",precision=19,scale=2) private BigDecimal priceOverride;
 protected StoreProduct(){} public StoreProduct(String s,Product p){storeId=s;product=p;} public UUID getId(){return id;} public String getStoreId(){return storeId;} public void setStoreId(String v){storeId=v;} public String getStoreName(){return storeName;} public void setStoreName(String v){storeName=v;} public Product getProduct(){return product;} public void setProduct(Product v){product=v;}
 public boolean isAvailable(){return available;} public void setAvailable(boolean v){available=v;} public BigDecimal getPriceOverride(){return priceOverride;} public void setPriceOverride(BigDecimal v){priceOverride=v;}
}
