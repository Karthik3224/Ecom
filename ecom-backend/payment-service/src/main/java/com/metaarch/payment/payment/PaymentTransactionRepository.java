package com.metaarch.payment.payment;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
  List<PaymentTransaction> findByPaymentIdOrderByCreatedAtDesc(UUID paymentId);
  boolean existsByTransactionReference(String transactionReference);
}
