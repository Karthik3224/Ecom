package com.metaarch.order.order;

import jakarta.validation.constraints.NotBlank;

public record UpdateOrderPaymentStatusRequest(@NotBlank String paymentStatus) {
  PaymentStatus normalizedPaymentStatus() {
    return PaymentStatus.fromExternal(paymentStatus);
  }
}
