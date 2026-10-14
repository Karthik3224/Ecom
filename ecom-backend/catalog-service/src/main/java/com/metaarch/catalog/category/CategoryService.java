package com.metaarch.catalog.category;
import java.util.*; import com.metaarch.catalog.exception.*; import com.metaarch.catalog.product.ProductRepository; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service public class CategoryService {
 private final CategoryRepository categories; private final ProductRepository products; public CategoryService(CategoryRepository c,ProductRepository p){categories=c;products=p;}
 @Transactional public CategoryResponse create(CategoryRequest r){
  String slug=clean(r.slug());
  if(categories.existsBySlugIgnoreCase(slug)) throw new ConflictException("Category slug already exists");
  Category c=new Category(clean(r.name()),slug);
  apply(c,r);
  return CategoryResponse.from(categories.save(c));
 }
 @Transactional(readOnly=true) public List<CategoryResponse> list(){return categories.findAll().stream().map(CategoryResponse::from).toList();}
 @Transactional(readOnly=true) public CategoryResponse get(UUID id){return CategoryResponse.from(find(id));}
 @Transactional public CategoryResponse update(UUID id,CategoryRequest r){
  Category c=find(id);
  String slug=clean(r.slug());
  if(categories.existsBySlugIgnoreCaseAndIdNot(slug,id)) throw new ConflictException("Category slug already exists");
  c.setSlug(slug);
  apply(c,r);
  return CategoryResponse.from(c);
 }
 @Transactional public void delete(UUID id){
  Category c=find(id);
  if(products.existsByCategoryId(id)) throw new ConflictException("Category cannot be deleted while it contains products");
  categories.delete(c);
 }
 public Category find(UUID id){return categories.findById(id).orElseThrow(()->new ResourceNotFoundException("Category not found: "+id));}
 private void apply(Category c,CategoryRequest r){c.setName(clean(r.name()));c.setDescription(blank(r.description()));c.setThumbnailUrl(blank(r.thumbnailUrl()));c.setActive(r.active());} private String clean(String v){return v.trim();} private String blank(String v){return v==null||v.isBlank()?null:v.trim();}
}
