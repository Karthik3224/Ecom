package com.metaarch.catalog.variant;
import java.math.BigDecimal; import java.time.Instant; import java.util.UUID;
public record ProductVariantResponse(UUID id,UUID productId,String sku,String name,String attributes,BigDecimal price,BigDecimal compareAtPrice,boolean active,Instant createdAt,Instant updatedAt) { public static ProductVariantResponse from(ProductVariant v){return new ProductVariantResponse(v.getId(),v.getProduct().getId(),v.getSku(),v.getName(),v.getAttributes(),v.getPrice(),v.getCompareAtPrice(),v.isActive(),v.getCreatedAt(),v.getUpdatedAt());} }
