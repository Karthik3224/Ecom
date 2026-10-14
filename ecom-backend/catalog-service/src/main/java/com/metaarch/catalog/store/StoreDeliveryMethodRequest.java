package com.metaarch.catalog.store;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record StoreDeliveryMethodRequest(
  Long id,
  @NotBlank @Size(max = 60) String deliveryType,
  boolean enabled,
  @DecimalMin("0.00") BigDecimal deliveryCharge,
  @Size(max = 80) String estimatedTime,
  @Size(max = 20) String cutoffTime,
  @Size(max = 2000) String settingsConfiguration
) {}
