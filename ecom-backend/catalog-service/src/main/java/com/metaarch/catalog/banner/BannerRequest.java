package com.metaarch.catalog.banner;

import java.time.LocalDate;
import jakarta.validation.constraints.*;

public record BannerRequest(
    @NotBlank @Size(max = 180) String title,
    @Size(max = 1000) String description,
    @NotBlank @Pattern(regexp = "^(https?://.+|data:image/.+)", message = "must be an HTTP(S) or data image URL") String imageUrl,
    @Pattern(regexp = "^$|^(https?://.+|data:image/.+)", message = "must be an HTTP(S) or data image URL") String mobileImageUrl,
    @Size(max = 2048) @Pattern(regexp = "^$|^https?://.+", message = "must be an HTTP or HTTPS URL") String targetUrl,
    BannerScope scope,
    @Size(max = 100) String locationId,
    @Size(max = 100) String storeId,
    @PositiveOrZero Integer sortOrder,
    BannerStatus status,
    LocalDate startsOn,
    LocalDate endsOn) {

  public BannerScope scopeOrDefault() { return scope == null ? BannerScope.GLOBAL : scope; }
  public BannerStatus statusOrDefault() { return status == null ? BannerStatus.ACTIVE : status; }
  public int sortOrderOrZero() { return sortOrder == null ? 0 : sortOrder; }
}
