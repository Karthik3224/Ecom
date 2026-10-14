package com.metaarch.order.order;

import java.util.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateOrderRequest(
  @NotNull UUID customerId,
  @NotNull UUID cartId,
  @NotBlank @Size(max = 100) String storeId,
  @NotEmpty List<@Valid CreateOrderItemRequest> items,
  List<@Valid CreateOrderAddressRequest> addresses,
  @Valid CreateOrderAddressRequest shippingAddress,
  @Valid CreateOrderAddressRequest billingAddress,
  PaymentStatus paymentStatus,
  Long deliveryZoneId,
  @DecimalMin("0.00") BigDecimal calculatedDistanceKm,
  @Min(0) Long routeDistanceMeters,
  @Min(0) Integer routeDurationSeconds,
  @Min(0) Integer routeDurationMinutes,
  @Size(max = 80) String matchedZoneLabel,
  @DecimalMin("-90.0000000") @DecimalMax("90.0000000") BigDecimal customerLatitude,
  @DecimalMin("-180.0000000") @DecimalMax("180.0000000") BigDecimal customerLongitude,
  @DecimalMin("-90.0000000") @DecimalMax("90.0000000") BigDecimal storeLatitude,
  @DecimalMin("-180.0000000") @DecimalMax("180.0000000") BigDecimal storeLongitude,
  @Size(max = 80) String deliveryMethod,
  @Size(max = 40) String fulfillmentType,
  @Size(max = 40) String globalApproval,
  @DecimalMin("0.00") BigDecimal deliveryCharge,
  @Min(0) Integer estimatedDeliveryMin,
  @Min(0) Integer estimatedDeliveryMax,
  @DecimalMin("0.00") BigDecimal freeDeliveryAbove,
  boolean freeDeliveryApplied,
  LocalDate scheduledDeliveryDate,
  @Size(max = 80) String scheduledDeliverySlot,
  @Size(max = 1000) String pickupDetails
) { }
