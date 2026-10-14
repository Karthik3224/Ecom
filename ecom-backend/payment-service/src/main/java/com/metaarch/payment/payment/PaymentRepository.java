package com.metaarch.payment.payment;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select p from Payment p where p.id = :id")
  Optional<Payment> findLockedById(@org.springframework.data.repository.query.Param("id") UUID id);
  Optional<Payment> findByOrderId(UUID orderId);
  boolean existsByOrderId(UUID orderId);
  boolean existsByPaymentReference(String paymentReference);
}
