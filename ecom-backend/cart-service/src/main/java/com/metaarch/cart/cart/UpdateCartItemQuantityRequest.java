package com.metaarch.cart.cart;

import jakarta.validation.constraints.*;

public record UpdateCartItemQuantityRequest(@NotNull @Min(1) Integer quantity) { }
