package com.metaarch.catalog.storeproduct;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface StoreProductRepository extends JpaRepository<StoreProduct,UUID> { List<StoreProduct> findByStoreId(String storeId); List<StoreProduct> findByProductId(UUID productId); boolean existsByStoreIdAndProductId(String storeId,UUID productId); boolean existsByStoreIdAndProductIdAndIdNot(String storeId,UUID productId,UUID id); void deleteByProductId(UUID productId); }
