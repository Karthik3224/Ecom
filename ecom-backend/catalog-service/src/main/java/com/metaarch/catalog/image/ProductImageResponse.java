package com.metaarch.catalog.image;
import java.time.Instant; import java.util.UUID;
public record ProductImageResponse(UUID id,UUID productId,String url,String altText,int displayOrder,boolean primaryImage,Instant createdAt,Instant updatedAt) { public static ProductImageResponse from(ProductImage v){return new ProductImageResponse(v.getId(),v.getProduct().getId(),v.getUrl(),v.getAltText(),v.getDisplayOrder(),v.isPrimaryImage(),v.getCreatedAt(),v.getUpdatedAt());} }
