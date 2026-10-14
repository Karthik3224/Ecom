package com.metaarch.payment.payment;

import java.util.UUID;

public record PaymentStatusResponse(
  UUID paymentId,
  UUID orderId,
  String paymentReference,
  PaymentStatus status
) {
  public static PaymentStatusResponse from(Payment payment) {
    return new PaymentStatusResponse(payment.getId(), payment.getOrderId(), payment.getPaymentReference(), payment.getStatus());
  }
}
