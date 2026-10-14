package com.metaarch.orgaccess.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class UserAccount {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 190)
  private String username;

  @Column(nullable = false, unique = true, length = 255)
  private String email;

  @Column(name = "password_hash", length = 255)
  private String passwordHash;

  @Column(name = "oauth_subject", unique = true, length = 255)
  private String oauthSubject;

  @Column(name = "display_name", length = 180)
  private String displayName;

  @Column(length = 30)
  private String mobile;

  @Column(length = 30)
  private String status = "Active";

  @Column(nullable = false)
  private boolean enabled = true;

  @Column(nullable = false)
  private boolean locked = false;

  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
  private Set<Role> roles = new HashSet<>();

  @Column(name = "vehicle_type", length = 40)
  private String vehicleType;
  public String getVehicleType() { return vehicleType; }
  public void setVehicleType(String value) { vehicleType = value; }

  @Column(name = "vehicle_number", length = 40)
  private String vehicleNumber;
  public String getVehicleNumber() { return vehicleNumber; }
  public void setVehicleNumber(String value) { vehicleNumber = value; }

  @Column(name = "licence_number", length = 60)
  private String licenceNumber;
  public String getLicenceNumber() { return licenceNumber; }
  public void setLicenceNumber(String value) { licenceNumber = value; }

  @Column(name = "address", length = 700)
  private String address;
  public String getAddress() { return address; }
  public void setAddress(String value) { address = value; }

  @Column(name = "token_version", nullable = false)
  private long tokenVersion;
  public long getTokenVersion() { return tokenVersion; }

  public Long getId() { return id; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public String getOauthSubject() { return oauthSubject; }
  public void setOauthSubject(String oauthSubject) { this.oauthSubject = oauthSubject; }
  public String getDisplayName() { return displayName; }
  public void setDisplayName(String displayName) { this.displayName = displayName; }
  public String getMobile() { return mobile; }
  public void setMobile(String mobile) { this.mobile = mobile; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }
  public boolean isLocked() { return locked; }
  public void setLocked(boolean locked) { this.locked = locked; }
  public Set<Role> getRoles() { return roles; }
}
