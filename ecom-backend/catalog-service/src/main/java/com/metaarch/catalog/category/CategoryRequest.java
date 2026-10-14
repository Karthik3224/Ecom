package com.metaarch.catalog.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
  @NotBlank @Size(max = 120) String name,
  @NotBlank @Size(max = 140) @Pattern(regexp = "\\A[a-z0-9]++(?:-[a-z0-9]++)*+\\z", message = "must be a lowercase URL slug") String slug,
  @Size(max = 1000) String description,
  @Size(max = 2048) @Pattern(regexp = "\\A(?:|https?://\\S++)\\z", message = "must be an HTTP or HTTPS URL") String thumbnailUrl,
  boolean active
) {}
