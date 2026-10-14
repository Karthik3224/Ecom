package com.metaarch.orgaccess.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "memberships")
public class Membership {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private UserAccount user;
  @ManyToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "role_id", nullable = false)
  private Role role;
  @Column(name = "organization_id", length = 100)
  private String organizationId;
  @Column(name = "location_id", length = 100)
  private String locationId;
  @Column(name = "store_id", length = 100)
  private String storeId;
  @Column(name = "store_name", length = 180)
  private String storeName;
  @Column(name = "store_location", length = 160)
  private String storeLocation;
  @Column(name = "store_address", length = 700)
  private String storeAddress;
  @Column
  private Double latitude;
  @Column
  private Double longitude;
  @Column(length = 40)
  private String provider;
  @Column(name = "provider_place_id", length = 120)
  private String providerPlaceId;
  @Column(name = "provider_osm_type", length = 20)
  private String providerOsmType;
  @Column(name = "provider_osm_id", length = 40)
  private String providerOsmId;
  @Column(name = "location_accuracy_meters")
  private Double locationAccuracyMeters;
  @Column(name = "assigned_by", length = 190)
  private String assignedBy;

  public Long getId() { return id; }
  public UserAccount getUser() { return user; }
  public void setUser(UserAccount user) { this.user = user; }
  public Role getRole() { return role; }
  public void setRole(Role role) { this.role = role; }
  public String getOrganizationId() { return organizationId; }
  public void setOrganizationId(String value) { organizationId = value; }
  public String getLocationId() { return locationId; }
  public void setLocationId(String value) { locationId = value; }
  public String getStoreId() { return storeId; }
  public void setStoreId(String value) { storeId = value; }
  public String getStoreName() { return storeName; }
  public void setStoreName(String value) { storeName = value; }
  public String getStoreLocation() { return storeLocation; }
  public void setStoreLocation(String value) { storeLocation = value; }
  public String getStoreAddress() { return storeAddress; }
  public void setStoreAddress(String value) { storeAddress = value; }
  public Double getLatitude() { return latitude; }
  public void setLatitude(Double value) { latitude = value; }
  public Double getLongitude() { return longitude; }
  public void setLongitude(Double value) { longitude = value; }
  public String getProvider() { return provider; }
  public void setProvider(String value) { provider = value; }
  public String getProviderPlaceId() { return providerPlaceId; }
  public void setProviderPlaceId(String value) { providerPlaceId = value; }
  public String getProviderOsmType() { return providerOsmType; }
  public void setProviderOsmType(String value) { providerOsmType = value; }
  public String getProviderOsmId() { return providerOsmId; }
  public void setProviderOsmId(String value) { providerOsmId = value; }
  public Double getLocationAccuracyMeters() { return locationAccuracyMeters; }
  public void setLocationAccuracyMeters(Double value) { locationAccuracyMeters = value; }
  public String getAssignedBy() { return assignedBy; }
  public void setAssignedBy(String value) { assignedBy = value; }
}
