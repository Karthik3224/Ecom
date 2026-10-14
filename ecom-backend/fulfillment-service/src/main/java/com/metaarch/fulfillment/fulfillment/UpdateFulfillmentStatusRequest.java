package com.metaarch.fulfillment.fulfillment;

import jakarta.validation.constraints.NotNull;

public record UpdateFulfillmentStatusRequest(@NotNull FulfillmentStatus status) { }
