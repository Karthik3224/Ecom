package com.metaarch.fulfillment.tracking;

import java.time.Instant;
import com.metaarch.fulfillment.shipment.ShipmentStatus;
import jakarta.validation.constraints.*;

public record AddTrackingEventRequest(
  @NotNull ShipmentStatus status,
  @NotBlank @Size(max = 160) String location,
  @NotBlank @Size(max = 500) String description,
  @NotNull Instant eventTime
) { }
