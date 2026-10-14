package com.metaarch.catalog.store;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record StoreDeliveryZoneRequest(
  @NotNull @DecimalMin("0.00") BigDecimal minRadiusKm,
  @NotNull @DecimalMin("0.01") BigDecimal maxRadiusKm,
  @Min(0) Integer estimatedDeliveryMin,
  @Min(0) Integer estimatedDeliveryMax,
  @NotNull @DecimalMin("0.00") BigDecimal deliveryCharge,
  @DecimalMin("0.00") BigDecimal freeDeliveryAbove,
  @DecimalMin("0.00") BigDecimal minimumOrder,
  @Size(max = 40) String status,
  @Valid List<StoreDeliveryMethodRequest> methods
) {}
