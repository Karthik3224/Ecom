package com.metaarch.catalog.storeproduct;
import java.math.BigDecimal; import java.time.Instant; import java.util.UUID;
public record StoreProductResponse(UUID id,String storeId,String storeName,UUID productId,String productName,boolean available,BigDecimal priceOverride,Instant createdAt,Instant updatedAt) { static StoreProductResponse from(StoreProduct v){return new StoreProductResponse(v.getId(),v.getStoreId(),v.getStoreName(),v.getProduct().getId(),v.getProduct().getName(),v.isAvailable(),v.getPriceOverride(),v.getCreatedAt(),v.getUpdatedAt());} }
