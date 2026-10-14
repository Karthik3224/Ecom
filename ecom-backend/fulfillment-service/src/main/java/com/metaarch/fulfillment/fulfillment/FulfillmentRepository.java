package com.metaarch.fulfillment.fulfillment;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FulfillmentRepository extends JpaRepository<Fulfillment, UUID> {
  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select f from Fulfillment f where f.id = :id")
  Optional<Fulfillment> findLockedById(@org.springframework.data.repository.query.Param("id") UUID id);
  Optional<Fulfillment> findByOrderId(UUID orderId);
  boolean existsByOrderId(UUID orderId);
}
