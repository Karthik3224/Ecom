package com.metaarch.cart.cart;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.*;

public record AddCartItemRequest(@NotNull UUID productId, UUID variantId, @NotBlank @Size(max = 255) String productName,
                                 @NotNull @Min(1) Integer quantity, @NotNull @DecimalMin("0.00") @Digits(integer = 17, fraction = 2) BigDecimal unitPrice) { }
