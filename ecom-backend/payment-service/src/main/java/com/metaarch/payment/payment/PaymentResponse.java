package com.metaarch.payment.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
  UUID id,
  UUID orderId,
  UUID customerId,
  String paymentReference,
  BigDecimal amount,
  String currency,
  PaymentMethod paymentMethod,
  PaymentStatus status,
  Instant createdAt,
  Instant updatedAt
) {
  public static PaymentResponse from(Payment payment) {
    return new PaymentResponse(
      payment.getId(),
      payment.getOrderId(),
      payment.getCustomerId(),
      payment.getPaymentReference(),
      payment.getAmount(),
      payment.getCurrency(),
      payment.getPaymentMethod(),
      payment.getStatus(),
      payment.getCreatedAt(),
      payment.getUpdatedAt());
  }
}
