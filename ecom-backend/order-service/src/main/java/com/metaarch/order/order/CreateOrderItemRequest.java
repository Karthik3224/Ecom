package com.metaarch.order.order;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.*;

public record CreateOrderItemRequest(
  @NotNull UUID productId,
  UUID variantId,
  @NotBlank @Size(max = 255) String productName,
  @Min(1) int quantity,
  @NotNull @DecimalMin(value = "0.00", inclusive = false) BigDecimal unitPrice
) { }
