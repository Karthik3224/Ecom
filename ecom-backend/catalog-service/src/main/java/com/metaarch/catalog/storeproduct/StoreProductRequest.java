package com.metaarch.catalog.storeproduct;
import java.math.BigDecimal; import java.util.UUID; import jakarta.validation.constraints.*;
public record StoreProductRequest(@NotBlank @Size(max=100) String storeId,@Size(max=180) String storeName,@NotNull UUID productId,boolean available,@DecimalMin("0.00") @Digits(integer=17,fraction=2) BigDecimal priceOverride) {}
