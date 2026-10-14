package com.metaarch.cart.cart;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public record CheckoutCartRequest(@NotBlank @Pattern(regexp="[a-f0-9]{64}") String requestHash,
    @NotBlank String storeId, @NotEmpty List<@Valid Line> items) {
  public record Line(@NotNull UUID productId, UUID variantId, @NotNull @Min(1) Integer quantity) { }
}
