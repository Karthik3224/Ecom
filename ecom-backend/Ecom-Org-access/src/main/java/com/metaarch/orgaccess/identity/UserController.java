package com.metaarch.orgaccess.identity;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final IdentityService identities;
  public UserController(IdentityService identities) { this.identities = identities; }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','GLOBAL_ADMIN') and hasAuthority('PERM_USER_WRITE')")
  public UserSummary create(@Valid @RequestBody UserCreateRequest request, Authentication authentication) {
    UserAccount user = identities.create(request, authentication.getName());
    return new UserSummary(user.getId(), user.getUsername(), user.getEmail());
  }

  @PutMapping("/me/password")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void changeMyPassword(@Valid @RequestBody PasswordChangeRequest request, Authentication authentication) {
    identities.changePassword(authentication.getName(), request.currentPassword(), request.newPassword());
  }

  public record UserSummary(Long id, String username, String email) {}
}
