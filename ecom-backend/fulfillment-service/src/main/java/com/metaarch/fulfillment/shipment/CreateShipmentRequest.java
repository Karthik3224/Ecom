package com.metaarch.fulfillment.shipment;

import java.time.LocalDate;
import java.util.UUID;
import jakarta.validation.constraints.*;

public record CreateShipmentRequest(
  @NotNull UUID fulfillmentId,
  @NotBlank @Size(max = 80) String carrier,
  @Size(max = 120) String trackingNumber,
  @NotNull LocalDate estimatedDeliveryDate
) { }
