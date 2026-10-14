package com.metaarch.catalog.product;
import java.util.UUID; import org.springframework.data.domain.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface ProductRepository extends JpaRepository<Product,UUID> {
 boolean existsByCategoryId(UUID categoryId); boolean existsBySlugIgnoreCase(String slug); boolean existsBySlugIgnoreCaseAndIdNot(String slug,UUID id); boolean existsBySkuIgnoreCase(String sku); boolean existsBySkuIgnoreCaseAndIdNot(String sku,UUID id);
 Page<Product> findByCategoryId(UUID categoryId,Pageable pageable); Page<Product> findByStatus(ProductStatus status,Pageable pageable); Page<Product> findByCategoryIdAndStatus(UUID categoryId,ProductStatus status,Pageable pageable);
 @Query("select p from Product p where (:categoryId is null or p.category.id=:categoryId) and (:status is null or p.status=:status) and (:globalProduct is null or p.globalProduct=:globalProduct) and (:search is null or lower(p.name) like lower(concat('%',:search,'%')) or lower(coalesce(p.description,'')) like lower(concat('%',:search,'%')) or lower(coalesce(p.brand,'')) like lower(concat('%',:search,'%')))")
 Page<Product> search(@Param("categoryId") UUID categoryId,@Param("status") ProductStatus status,@Param("search") String search,@Param("globalProduct") Boolean globalProduct,Pageable pageable);
}
