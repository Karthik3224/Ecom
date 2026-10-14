package com.metaarch.customerprofile.profile;
import java.time.Instant; import java.time.LocalDate; import java.util.UUID;
public record ProfileResponse(UUID id, String username, String name, String phone, String email, Gender gender, LocalDate dateOfBirth, String photo, Instant createdAt, Instant updatedAt) {
  static ProfileResponse from(CustomerProfile p) { return new ProfileResponse(p.getId(), p.getUsername(), p.getName(), p.getPhone(), p.getEmail(), p.getGender(), p.getDateOfBirth(), p.getPhoto(), p.getCreatedAt(), p.getUpdatedAt()); }
}
