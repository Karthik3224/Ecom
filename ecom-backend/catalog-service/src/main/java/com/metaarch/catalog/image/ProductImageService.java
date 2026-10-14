package com.metaarch.catalog.image;
import java.util.*; import com.metaarch.catalog.exception.ResourceNotFoundException; import com.metaarch.catalog.product.ProductService; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service public class ProductImageService {
 private final ProductImageRepository images; private final ProductService products; public ProductImageService(ProductImageRepository i,ProductService p){images=i;products=p;}
 @Transactional public ProductImageResponse create(UUID productId,ProductImageRequest r){
  ProductImage i=new ProductImage(products.find(productId),r.url().trim());
  apply(i,r);
  i=images.save(i);
  if(i.isPrimaryImage()) images.clearOtherPrimaryImages(productId,i.getId());
  return ProductImageResponse.from(i);
 }
 @Transactional(readOnly=true) public List<ProductImageResponse> list(UUID productId){products.find(productId);return images.findByProductIdOrderByDisplayOrderAsc(productId).stream().map(ProductImageResponse::from).toList();}
 @Transactional(readOnly=true) public ProductImageResponse get(UUID id){return ProductImageResponse.from(find(id));}
 @Transactional public ProductImageResponse update(UUID id,ProductImageRequest r){
  ProductImage i=find(id);
  apply(i,r);
  if(i.isPrimaryImage()) images.clearOtherPrimaryImages(i.getProduct().getId(),i.getId());
  return ProductImageResponse.from(i);
 }
 @Transactional public void delete(UUID id){images.delete(find(id));}
 private ProductImage find(UUID id){return images.findById(id).orElseThrow(()->new ResourceNotFoundException("Product image not found: "+id));}
 private void apply(ProductImage i,ProductImageRequest r){i.setUrl(r.url().trim());i.setAltText(r.altText()==null||r.altText().isBlank()?null:r.altText().trim());i.setDisplayOrder(r.displayOrder());i.setPrimaryImage(r.primaryImage());}
}
