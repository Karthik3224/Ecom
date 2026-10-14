package com.metaarch.customerprofile.profile;

import java.time.LocalDate;
import java.util.UUID;
import jakarta.persistence.*;

@Entity
@Table(name = "customer_profiles", uniqueConstraints = @UniqueConstraint(name = "uk_customer_profiles_username", columnNames = "username"))
public class CustomerProfile extends AuditedEntity {
  @Id private UUID id;
  @Column(nullable = false, length = 191) private String username;
  @Column(nullable = false, length = 120) private String name;
  @Column(nullable = false, length = 20) private String phone;
  @Column(length = 254) private String email;
  @Enumerated(EnumType.STRING) @Column(length = 32) private Gender gender;
  private LocalDate dateOfBirth;
  @Column(columnDefinition = "MEDIUMTEXT") private String photo;
  protected CustomerProfile() {}
  public CustomerProfile(String username, String name, String phone) { this.id = UUID.randomUUID(); this.username = username; this.name = name; this.phone = phone; }
  public void setId(UUID id) { this.id=id; }
  public UUID getId() { return id; } public String getUsername() { return username; }
  public String getName() { return name; } public void setName(String value) { name = value; }
  public String getPhone() { return phone; } public void setPhone(String value) { phone = value; }
  public String getEmail() { return email; } public void setEmail(String value) { email = value; }
  public Gender getGender() { return gender; } public void setGender(Gender value) { gender = value; }
  public LocalDate getDateOfBirth() { return dateOfBirth; } public void setDateOfBirth(LocalDate value) { dateOfBirth = value; }
  public String getPhoto() { return photo; } public void setPhoto(String value) { photo = value; }
}
