package com.metaarch.order.order;

import jakarta.validation.constraints.*;

public record CreateOrderAddressRequest(
  AddressType addressType,
  @NotBlank @Size(max = 255) String addressLine1,
  @Size(max = 255) String addressLine2,
  @NotBlank @Size(max = 120) String city,
  @NotBlank @Size(max = 120) String state,
  @NotBlank @Size(max = 120) String country,
  @NotBlank @Size(max = 30) String postalCode,
  @Size(max = 180) String recipientName,
  @Size(max = 30) String recipientPhone
) { }
