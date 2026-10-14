package com.metaarch.cart.cart;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface CartRepository extends JpaRepository<Cart, UUID> {
  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from Cart c where c.id = :id")
  Optional<Cart> findLockedById(@Param("id") UUID id);
  @Query("select distinct c from Cart c left join fetch c.items where c.id = :id") Optional<Cart> findWithItemsById(@Param("id") UUID id);
  @Query("select distinct c from Cart c left join fetch c.items where c.customerId = :customerId and c.storeId = :storeId and c.status = :status") Optional<Cart> findWithItemsByCustomerIdAndStoreIdAndStatus(@Param("customerId") UUID customerId, @Param("storeId") String storeId, @Param("status") CartStatus status);
  boolean existsByCustomerIdAndStoreIdAndStatus(UUID customerId, String storeId, CartStatus status);
}
