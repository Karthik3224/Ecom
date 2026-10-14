package com.metaarch.fulfillment.shipment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssignDeliveryPartnerRequest(
  @NotBlank @Size(max = 100) String deliveryPartnerId,
  @NotBlank @Size(max = 180) String deliveryPartnerName,
  @Size(max = 40) String deliveryPartnerPhone,
  @Size(max = 40) String vehicleNumber
) { }
