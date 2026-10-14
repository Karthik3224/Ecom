package com.metaarch.payment.payment;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record RefundPaymentRequest(
  @DecimalMin(value = "0.01") BigDecimal amount,
  @Size(max = 255) String reason
) { }
