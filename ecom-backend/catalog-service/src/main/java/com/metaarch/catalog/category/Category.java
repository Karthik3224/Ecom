package com.metaarch.catalog.category;

import java.util.*;
import com.metaarch.catalog.common.AuditedEntity;
import com.metaarch.catalog.product.Product;
import jakarta.persistence.*;

@Entity @Table(name="categories", uniqueConstraints=@UniqueConstraint(name="uk_categories_slug", columnNames="slug"))
public class Category extends AuditedEntity {
  @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
  @Column(nullable=false, length=120) private String name;
  @Column(nullable=false, length=140) private String slug;
  @Column(length=1000) private String description;
  @Column(name="thumbnail_url", length=2048) private String thumbnailUrl;
  @Column(nullable=false) private boolean active = true;
  @OneToMany(mappedBy="category", fetch=FetchType.LAZY) private List<Product> products = new ArrayList<>();
  protected Category() {}
  public Category(String name, String slug) { this.name=name; this.slug=slug; }
  public UUID getId(){return id;} public String getName(){return name;} public void setName(String v){name=v;}
  public String getSlug(){return slug;} public void setSlug(String v){slug=v;} public String getDescription(){return description;}
  public void setDescription(String v){description=v;} public String getThumbnailUrl(){return thumbnailUrl;} public void setThumbnailUrl(String v){thumbnailUrl=v;} public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
  public List<Product> getProducts(){return Collections.unmodifiableList(products);}
}
