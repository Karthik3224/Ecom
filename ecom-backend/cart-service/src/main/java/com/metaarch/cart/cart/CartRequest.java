package com.metaarch.cart.cart;

import java.util.UUID;
import jakarta.validation.constraints.*;

public record CartRequest(@NotNull UUID customerId, @NotBlank @Size(max = 100) String storeId) { }
