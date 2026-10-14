package com.metaarch.catalog.store;

public record DeliveryZoneLocationResponse(Long deliveryZoneId, String storeId, String locationId) {
  static DeliveryZoneLocationResponse from(StoreDeliveryZone zone) {
    return new DeliveryZoneLocationResponse(zone.getId(), zone.getStoreId(), zone.getLocationId());
  }
}
