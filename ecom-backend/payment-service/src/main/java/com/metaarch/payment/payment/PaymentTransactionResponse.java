package com.metaarch.payment.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentTransactionResponse(
  UUID id,
  UUID paymentId,
  String transactionReference,
  TransactionType transactionType,
  BigDecimal amount,
  TransactionStatus status,
  Instant createdAt
) {
  public static PaymentTransactionResponse from(PaymentTransaction transaction) {
    return new PaymentTransactionResponse(
      transaction.getId(),
      transaction.getPayment().getId(),
      transaction.getTransactionReference(),
      transaction.getTransactionType(),
      transaction.getAmount(),
      transaction.getStatus(),
      transaction.getCreatedAt());
  }
}
