package com.metaarch.catalog.image;
import jakarta.validation.constraints.*;
public record ProductImageRequest(@NotBlank @Size(max=2048) @Pattern(regexp="^https?://.+",message="must be an HTTP or HTTPS URL") String url,@Size(max=255) String altText,@PositiveOrZero int displayOrder,boolean primaryImage) {}
