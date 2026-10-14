package com.metaarch.customerprofile.address;
import java.time.Instant; import java.util.UUID;
public record AddressResponse(UUID id,String type,String address,String phone,String houseNumber,String floor,String landmark,Double latitude,Double longitude,String street,String city,String state,String pincode,boolean defaultAddress,Instant createdAt,Instant updatedAt) {
 static AddressResponse from(CustomerAddress a){return new AddressResponse(a.getId(),a.getType(),a.getAddress(),a.getPhone(),a.getHouseNumber(),a.getFloor(),a.getLandmark(),a.getLatitude(),a.getLongitude(),a.getStreet(),a.getCity(),a.getState(),a.getPincode(),a.isDefaultAddress(),a.getCreatedAt(),a.getUpdatedAt());}
}
