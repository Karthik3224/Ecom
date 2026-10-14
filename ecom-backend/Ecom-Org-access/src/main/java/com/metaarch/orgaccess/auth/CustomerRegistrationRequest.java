package com.metaarch.orgaccess.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Public registration payload. Role assignment is intentionally not client controlled. */
public record CustomerRegistrationRequest(
    @NotBlank @Size(max = 190) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Pattern(regexp = "^\\+?[0-9 ]{10,15}$") String phone) {}
