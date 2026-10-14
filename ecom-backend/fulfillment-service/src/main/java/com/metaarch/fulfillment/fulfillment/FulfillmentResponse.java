package com.metaarch.fulfillment.fulfillment;

import java.time.Instant;
import java.util.UUID;

public record FulfillmentResponse(UUID id, UUID orderId, UUID customerId, String storeId, FulfillmentStatus status, FulfillmentType fulfillmentType, UUID shippingAddressId, Instant createdAt, Instant updatedAt) {
  static FulfillmentResponse from(Fulfillment fulfillment) {
    return new FulfillmentResponse(fulfillment.getId(), fulfillment.getOrderId(), fulfillment.getCustomerId(), fulfillment.getStoreId(), fulfillment.getStatus(), fulfillment.getFulfillmentType(), fulfillment.getShippingAddressId(), fulfillment.getCreatedAt(), fulfillment.getUpdatedAt());
  }
}
