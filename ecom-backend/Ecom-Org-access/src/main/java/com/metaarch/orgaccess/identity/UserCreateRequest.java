package com.metaarch.orgaccess.identity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
    @NotBlank @Size(max = 190) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank String role,
    @Size(max = 180) String name,
    @Size(max = 30) String mobile,
    @Size(max = 30) String status,
    @Size(max = 100) String organizationId,
    @Size(max = 100) String location,
    @Size(max = 100) String storeId,
    @Size(max = 180) String store,
    @Size(max = 160) String storeLocation,
    @Size(max = 700) String storeAddress,
    Double latitude,
    Double longitude,
    @Size(max = 40) String provider,
    @Size(max = 120) String providerPlaceId,
    @Size(max = 20) String providerOsmType,
    @Size(max = 40) String providerOsmId,
    Double locationAccuracyMeters,
    @Size(max = 190) String assignedBy) {}
