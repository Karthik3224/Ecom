package com.metaarch.catalog.image;
import java.util.UUID; import com.metaarch.catalog.common.AuditedEntity; import com.metaarch.catalog.product.Product; import jakarta.persistence.*;
@Entity @Table(name="product_images") public class ProductImage extends AuditedEntity {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id; @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="product_id",nullable=false) private Product product;
 @Column(nullable=false,length=2048) private String url; @Column(name="alt_text",length=255) private String altText; @Column(name="display_order",nullable=false) private int displayOrder; @Column(name="primary_image",nullable=false) private boolean primaryImage;
 protected ProductImage(){} public ProductImage(Product p,String u){product=p;url=u;} public UUID getId(){return id;} public Product getProduct(){return product;} public String getUrl(){return url;} public void setUrl(String v){url=v;}
 public String getAltText(){return altText;} public void setAltText(String v){altText=v;} public int getDisplayOrder(){return displayOrder;} public void setDisplayOrder(int v){displayOrder=v;} public boolean isPrimaryImage(){return primaryImage;} public void setPrimaryImage(boolean v){primaryImage=v;}
}
