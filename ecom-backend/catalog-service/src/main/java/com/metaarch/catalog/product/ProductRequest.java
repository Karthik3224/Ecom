package com.metaarch.catalog.product;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProductRequest(
  @NotNull UUID categoryId,
  @Size(max=80) String subcategory,
  @NotBlank @Size(max=180) String name,
  @NotBlank @Size(max=200) @Pattern(regexp="\\A[a-z0-9]++(?:-[a-z0-9]++)*+\\z",message="must be a lowercase URL slug") String slug,
  @NotBlank @Size(max=100) String sku,
  String description,
  @Size(max=120) String brand,
  String ingredients,
  String specifications,
  @Size(max=80) String pack,
  @Size(max=80) String type,
  @Size(max=80) String shelfLife,
  String tags,
  String highlights,
  String aboutSource,
  @NotNull ProductStatus status,
  Boolean featured,
  Boolean special,
  Boolean newArrival,
  Boolean bestSeller,
  Boolean globalProduct,
  @Size(max=40) String fulfillmentType,
  @Size(max=80) String deliveryMethod
) {}
