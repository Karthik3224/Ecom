package com.metaarch.catalog.image;
import java.util.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface ProductImageRepository extends JpaRepository<ProductImage,UUID> {
 List<ProductImage> findByProductIdOrderByDisplayOrderAsc(UUID productId); void deleteByProductId(UUID productId);
 @Modifying @Query("update ProductImage i set i.primaryImage=false where i.product.id=:productId and i.id<>:imageId") void clearOtherPrimaryImages(@Param("productId") UUID productId,@Param("imageId") UUID imageId);
}
