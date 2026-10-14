package com.metaarch.catalog.store;

import java.math.BigDecimal;
import java.time.Instant;

public record StoreDeliveryMethodResponse(Long id, String storeId, Long deliveryZoneId, String deliveryType, boolean enabled,
  BigDecimal deliveryCharge, String estimatedTime, String cutoffTime, String settingsConfiguration, Instant createdAt, Instant updatedAt) {
  static StoreDeliveryMethodResponse from(StoreDeliveryMethod m) {
    return new StoreDeliveryMethodResponse(m.getId(), m.getStoreId(), m.getZone() == null ? null : m.getZone().getId(),
      m.getDeliveryType(), m.isEnabled(), m.getDeliveryCharge(), m.getEstimatedTime(), m.getCutoffTime(),
      m.getSettingsConfiguration(), m.getCreatedAt(), m.getUpdatedAt());
  }
}
