package com.metaarch.catalog.variant;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductVariantRepository extends JpaRepository<ProductVariant,UUID> { List<ProductVariant> findByProductIdOrderByNameAsc(UUID productId); boolean existsBySkuIgnoreCase(String sku); boolean existsBySkuIgnoreCaseAndIdNot(String sku,UUID id); void deleteByProductId(UUID productId); }
