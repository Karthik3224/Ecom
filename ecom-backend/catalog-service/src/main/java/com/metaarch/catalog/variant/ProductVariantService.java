package com.metaarch.catalog.variant;
import java.util.*; import com.metaarch.catalog.exception.*; import com.metaarch.catalog.product.ProductService; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service public class ProductVariantService {
 private final ProductVariantRepository variants; private final ProductService products; public ProductVariantService(ProductVariantRepository v,ProductService p){variants=v;products=p;}
 @Transactional public ProductVariantResponse create(UUID productId,ProductVariantRequest r){validate(r,null);ProductVariant v=new ProductVariant(products.find(productId),clean(r.sku()),clean(r.name()),r.price());apply(v,r);return ProductVariantResponse.from(variants.save(v));}
 @Transactional(readOnly=true) public List<ProductVariantResponse> list(UUID productId){products.find(productId);return variants.findByProductIdOrderByNameAsc(productId).stream().map(ProductVariantResponse::from).toList();}
 @Transactional(readOnly=true) public ProductVariantResponse get(UUID id){return ProductVariantResponse.from(find(id));}
 @Transactional public ProductVariantResponse update(UUID id,ProductVariantRequest r){ProductVariant v=find(id);validate(r,id);v.setSku(clean(r.sku()));v.setName(clean(r.name()));apply(v,r);return ProductVariantResponse.from(v);}
 @Transactional public void delete(UUID id){variants.delete(find(id));}
 private ProductVariant find(UUID id){return variants.findById(id).orElseThrow(()->new ResourceNotFoundException("Product variant not found: "+id));}
 private void validate(ProductVariantRequest r,UUID id){
  boolean duplicate=id==null?variants.existsBySkuIgnoreCase(clean(r.sku())):variants.existsBySkuIgnoreCaseAndIdNot(clean(r.sku()),id);
  if(duplicate) throw new ConflictException("Variant SKU already exists");
  if(r.compareAtPrice()!=null&&r.compareAtPrice().compareTo(r.price())<0) throw new IllegalArgumentException("compareAtPrice must be greater than or equal to price");
 }
 private void apply(ProductVariant v,ProductVariantRequest r){v.setAttributes(blank(r.attributes()));v.setPrice(r.price());v.setCompareAtPrice(r.compareAtPrice());v.setActive(r.active());} private String clean(String v){return v.trim();} private String blank(String v){return v==null||v.isBlank()?null:v.trim();}
}
