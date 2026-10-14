package com.metaarch.fulfillment.fulfillment;

import java.util.UUID;
import jakarta.validation.constraints.*;

public record CreateFulfillmentRequest(
  @NotNull UUID orderId,
  @NotNull UUID customerId,
  @NotBlank @Size(max = 100) String storeId,
  UUID shippingAddressId,
  @NotNull FulfillmentType fulfillmentType
) { }
