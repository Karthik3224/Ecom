package com.metaarch.catalog.variant;
import java.math.BigDecimal; import jakarta.validation.constraints.*;
public record ProductVariantRequest(@NotBlank @Size(max=100) String sku,@NotBlank @Size(max=180) String name,String attributes,@NotNull @DecimalMin("0.00") @Digits(integer=17,fraction=2) BigDecimal price,@DecimalMin("0.00") @Digits(integer=17,fraction=2) BigDecimal compareAtPrice,boolean active) {}
