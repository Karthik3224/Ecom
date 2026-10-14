package com.metaarch.order.order;

public enum PaymentStatus {
  PENDING,
  PAID,
  SUCCESS,
  FAILED,
  REFUNDED;

  public static PaymentStatus fromExternal(String value) {
    if (value == null || value.isBlank()) throw new IllegalArgumentException("paymentStatus is required");
    return PaymentStatus.valueOf(value.trim().toUpperCase());
  }

  public boolean isPaid() {
    return this == PAID || this == SUCCESS;
  }
}
