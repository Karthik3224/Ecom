package com.metaarch.payment.payment;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record ProcessDemoPaymentRequest(@NotNull PaymentStatus status) {
  @AssertTrue(message = "Demo processing supports only SUCCESS, FAILED or PENDING")
  public boolean isProcessableStatus() {
    return status == PaymentStatus.SUCCESS || status == PaymentStatus.FAILED || status == PaymentStatus.PENDING;
  }
}
