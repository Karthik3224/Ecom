package com.metaarch.payment.payment;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.*;

public record InitiatePaymentRequest(
  @NotNull UUID orderId,
  @NotNull UUID customerId,
  @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
  @NotBlank @Size(min = 3, max = 3) String currency,
  @NotNull PaymentMethod paymentMethod
) { }
