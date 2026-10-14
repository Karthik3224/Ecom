package com.metaarch.customerprofile.profile;
import java.time.LocalDate;
import jakarta.validation.constraints.*;
public record ProfileRequest(@NotBlank @Size(max=120) String name, @NotBlank @Pattern(regexp="^\\+?[0-9 ]{10,15}$", message="must be a valid phone number") String phone, @Email @Size(max=254) String email, Gender gender, @Past LocalDate dateOfBirth, @Size(max=2800000, message="must be smaller than 2 MB") String photo) {}
