package com.metaarch.catalog.category;
import java.time.Instant; import java.util.UUID;
public record CategoryResponse(UUID id,String name,String slug,String description,String thumbnailUrl,boolean active,Instant createdAt,Instant updatedAt) { static CategoryResponse from(Category v){return new CategoryResponse(v.getId(),v.getName(),v.getSlug(),v.getDescription(),v.getThumbnailUrl(),v.isActive(),v.getCreatedAt(),v.getUpdatedAt());} }
