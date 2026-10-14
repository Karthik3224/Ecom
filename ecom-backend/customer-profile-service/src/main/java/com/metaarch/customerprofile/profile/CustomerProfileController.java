package com.metaarch.customerprofile.profile;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/profiles")
public class CustomerProfileController {
  private final CustomerProfileService service;
  public CustomerProfileController(CustomerProfileService service) { this.service = service; }
  @GetMapping("/me") ProfileResponse me(Authentication auth) { return service.get(auth.getName()); }
  @PutMapping("/me") ProfileResponse save(Authentication auth, @Valid @RequestBody ProfileRequest request) { String id = auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwt ? jwt.getToken().getClaimAsString("customerId") : null; return service.upsert(auth.getName(), request, id == null ? null : java.util.UUID.fromString(id)); }
  @DeleteMapping("/me") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(Authentication auth) { service.delete(auth.getName()); }
  @GetMapping("/{username}") ProfileResponse byUsername(@PathVariable String username) { return service.get(username); }
}
