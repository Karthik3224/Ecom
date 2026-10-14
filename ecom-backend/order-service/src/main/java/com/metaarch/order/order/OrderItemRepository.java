package com.metaarch.order.order;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
  @Query("select i from OrderItem i where i.order.id = :orderId")
  List<OrderItem> findByOrderId(@Param("orderId") UUID orderId);
}
