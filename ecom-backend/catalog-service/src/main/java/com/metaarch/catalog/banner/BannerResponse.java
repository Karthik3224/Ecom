package com.metaarch.catalog.banner;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BannerResponse(
    UUID id, String title, String description, String imageUrl, String mobileImageUrl, String targetUrl,
    BannerScope scope, String locationId, String storeId, int sortOrder, BannerStatus status,
    LocalDate startsOn, LocalDate endsOn, Instant createdAt, Instant updatedAt) {

  static BannerResponse from(Banner b) {
    return new BannerResponse(b.getId(), b.getTitle(), b.getDescription(), b.getImageUrl(), b.getMobileImageUrl(),
        b.getTargetUrl(), b.getScope(), b.getLocationId(), b.getStoreId(), b.getSortOrder(), b.getStatus(),
        b.getStartsOn(), b.getEndsOn(), b.getCreatedAt(), b.getUpdatedAt());
  }
}
