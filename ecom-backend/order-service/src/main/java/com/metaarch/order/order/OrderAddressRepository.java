package com.metaarch.order.order;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface OrderAddressRepository extends JpaRepository<OrderAddress, UUID> {
  @Query("select a from OrderAddress a where a.order.id = :orderId")
  List<OrderAddress> findByOrderId(@Param("orderId") UUID orderId);
}
