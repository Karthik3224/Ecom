package com.metaarch.catalog.store;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record StoreDeliveryZoneResponse(Long id, String storeId, BigDecimal minRadiusKm, BigDecimal maxRadiusKm,
  Integer estimatedDeliveryMin, Integer estimatedDeliveryMax, BigDecimal deliveryCharge, BigDecimal freeDeliveryAbove,
  BigDecimal minimumOrder, String status, List<StoreDeliveryMethodResponse> methods, Instant createdAt, Instant updatedAt) {
  static StoreDeliveryZoneResponse from(StoreDeliveryZone z, List<StoreDeliveryMethod> methods) {
    return new StoreDeliveryZoneResponse(z.getId(), z.getStoreId(), z.getMinRadiusKm(), z.getMaxRadiusKm(),
      z.getEstimatedDeliveryMin(), z.getEstimatedDeliveryMax(), z.getDeliveryCharge(), z.getFreeDeliveryAbove(),
      z.getMinimumOrder(), z.getStatus(), methods.stream().map(StoreDeliveryMethodResponse::from).toList(),
      z.getCreatedAt(), z.getUpdatedAt());
  }
}
