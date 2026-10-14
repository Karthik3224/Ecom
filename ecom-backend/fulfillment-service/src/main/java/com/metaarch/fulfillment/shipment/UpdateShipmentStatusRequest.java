package com.metaarch.fulfillment.shipment;

import jakarta.validation.constraints.NotNull;

public record UpdateShipmentStatusRequest(@NotNull ShipmentStatus status) { }
