package com.metaarch.catalog.store;

import java.math.BigDecimal;
import java.time.Instant;

public record StoreResponse(
  String id, String name, String storeCode, String logoUrl, String description, String location, String address,
  String doorNumber, String streetName, String area, String landmark, String city, String district, String state,
  String pincode, BigDecimal latitude, BigDecimal longitude,
  String provider, String providerPlaceId, String providerOsmType, String providerOsmId,
  BigDecimal locationAccuracyMeters, String phone, String alternatePhone, String email, String adminName,
  BigDecimal storeRating, String gstNumber, String status,
  boolean deliveryEnabled, boolean pickupEnabled, BigDecimal deliveryRadiusKm, Integer deliveryEtaMinutes,
  BigDecimal deliveryCharge, BigDecimal freeDeliveryAbove, String deliveryModes, String deliveryNotes,
  boolean isNew, boolean active, Instant createdAt, Instant updatedAt
) {
  static StoreResponse from(Store s) {
    return new StoreResponse(s.getId(), s.getName(), s.getStoreCode(), s.getLogoUrl(), s.getDescription(), s.getLocation(),
      s.getAddress(), s.getDoorNumber(), s.getStreetName(), s.getArea(), s.getLandmark(), s.getCity(), s.getDistrict(),
      s.getState(), s.getPincode(), s.getLatitude(), s.getLongitude(),
      s.getProvider(), s.getProviderPlaceId(), s.getProviderOsmType(), s.getProviderOsmId(), s.getLocationAccuracyMeters(),
      s.getPhone(), s.getAlternatePhone(), s.getEmail(), s.getAdminName(), s.getStoreRating(), s.getGstNumber(), s.getStatus(),
      s.isDeliveryEnabled(), s.isPickupEnabled(), s.getDeliveryRadiusKm(),
      s.getDeliveryEtaMinutes(), s.getDeliveryCharge(), s.getFreeDeliveryAbove(), s.getDeliveryModes(), s.getDeliveryNotes(),
      s.isNew(), s.isActive(), s.getCreatedAt(), s.getUpdatedAt());
  }
}
