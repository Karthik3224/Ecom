package com.metaarch.catalog.storeproduct;
import java.util.*; import com.metaarch.catalog.exception.*; import com.metaarch.catalog.product.ProductService; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service public class StoreProductService {
 private final StoreProductRepository mappings; private final ProductService products; public StoreProductService(StoreProductRepository m,ProductService p){mappings=m;products=p;}
 @Transactional public StoreProductResponse create(StoreProductRequest r){
  String store=clean(r.storeId());
  if(mappings.existsByStoreIdAndProductId(store,r.productId())) throw new ConflictException("Store-product mapping already exists");
  StoreProduct m=new StoreProduct(store,products.find(r.productId()));
  apply(m,r);
  return StoreProductResponse.from(mappings.save(m));
 }
 @Transactional(readOnly=true) public StoreProductResponse get(UUID id){return StoreProductResponse.from(find(id));}
 @Transactional(readOnly=true) public List<StoreProductResponse> list(String storeId,UUID productId){
  if(storeId!=null&&productId!=null) return mappings.findByStoreId(storeId).stream().filter(m->m.getProduct().getId().equals(productId)).map(StoreProductResponse::from).toList();
  if(storeId!=null) return mappings.findByStoreId(storeId).stream().map(StoreProductResponse::from).toList();
  if(productId!=null) return mappings.findByProductId(productId).stream().map(StoreProductResponse::from).toList();
  return mappings.findAll().stream().map(StoreProductResponse::from).toList();
 }
 @Transactional public StoreProductResponse update(UUID id,StoreProductRequest r){
  StoreProduct m=find(id);
  String store=clean(r.storeId());
  if(mappings.existsByStoreIdAndProductIdAndIdNot(store,r.productId(),id)) throw new ConflictException("Store-product mapping already exists");
  m.setStoreId(store);
  m.setProduct(products.find(r.productId()));
  apply(m,r);
  return StoreProductResponse.from(m);
 }
 @Transactional public void delete(UUID id){mappings.delete(find(id));}
 private StoreProduct find(UUID id){return mappings.findById(id).orElseThrow(()->new ResourceNotFoundException("Store-product mapping not found: "+id));}
 private void apply(StoreProduct m,StoreProductRequest r){m.setStoreName(storeName(r.storeId(),r.storeName()));m.setAvailable(r.available());m.setPriceOverride(r.priceOverride());}
 private String clean(String v){return v.trim();}
 private String storeName(String storeId,String storeName){
  String value=storeName==null?"":storeName.trim();
  if(!value.isBlank()) return value;
  return switch(clean(storeId)){case "store-gachibowli" -> "Thejo Gachibowli Store";case "store-hyd-001" -> "Thejo Hyderabad Central";case "store-1" -> "Thejo Sample Store 1";case "store-2" -> "Thejo Sample Store 2";default -> "Store "+clean(storeId);};
 }
}
