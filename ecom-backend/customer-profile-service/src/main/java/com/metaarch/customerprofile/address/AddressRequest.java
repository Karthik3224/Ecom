package com.metaarch.customerprofile.address;
import jakarta.validation.constraints.*;
public record AddressRequest(@NotBlank @Size(max=30) String type, @NotBlank @Size(max=1000) String address,
 @NotBlank @Pattern(regexp="^\\d{10,15}$") String phone, @NotBlank @Size(max=120) String houseNumber,
 @NotBlank @Size(max=50) String floor, @Size(max=160) String landmark, Double latitude, Double longitude,
 @Size(max=255) String street, @Size(max=120) String city, @Size(max=120) String state,
 @Pattern(regexp="^$|^\\d{5,6}$") String pincode, boolean defaultAddress) {}
