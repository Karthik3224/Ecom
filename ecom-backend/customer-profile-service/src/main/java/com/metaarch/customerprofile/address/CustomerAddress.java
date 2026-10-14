package com.metaarch.customerprofile.address;

import com.metaarch.customerprofile.profile.AuditedEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity @Table(name = "customer_addresses", indexes = @Index(name = "idx_customer_addresses_username", columnList = "username"))
public class CustomerAddress extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(nullable=false,length=191) private String username;
  @Column(nullable=false,length=30) private String type;
  @Column(nullable=false,length=1000) private String address;
  @Column(nullable=false,length=20) private String phone;
  @Column(nullable=false,length=120) private String houseNumber;
  @Column(nullable=false,length=50) private String floor;
  @Column(length=160) private String landmark;
  private Double latitude; private Double longitude;
  @Column(length=255) private String street;
  @Column(length=120) private String city;
  @Column(length=120) private String state;
  @Column(length=12) private String pincode;
  @Column(nullable=false) private boolean defaultAddress;
  protected CustomerAddress() {}
  public CustomerAddress(String username) { this.username=username; }
  public UUID getId(){return id;} public String getUsername(){return username;} public String getType(){return type;} public void setType(String v){type=v;}
  public String getAddress(){return address;} public void setAddress(String v){address=v;} public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
  public String getHouseNumber(){return houseNumber;} public void setHouseNumber(String v){houseNumber=v;} public String getFloor(){return floor;} public void setFloor(String v){floor=v;}
  public String getLandmark(){return landmark;} public void setLandmark(String v){landmark=v;} public Double getLatitude(){return latitude;} public void setLatitude(Double v){latitude=v;}
  public Double getLongitude(){return longitude;} public void setLongitude(Double v){longitude=v;} public String getStreet(){return street;} public void setStreet(String v){street=v;}
  public String getCity(){return city;} public void setCity(String v){city=v;} public String getState(){return state;} public void setState(String v){state=v;}
  public String getPincode(){return pincode;} public void setPincode(String v){pincode=v;} public boolean isDefaultAddress(){return defaultAddress;} public void setDefaultAddress(boolean v){defaultAddress=v;}
}
