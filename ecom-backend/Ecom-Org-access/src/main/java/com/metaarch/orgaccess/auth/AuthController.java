package com.metaarch.orgaccess.auth;

import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;
  private final com.metaarch.orgaccess.customer.CustomerAuthService customers;

  public AuthController(AuthService authService, com.metaarch.orgaccess.customer.CustomerAuthService customers) {
    this.customers = customers;
    this.authService = authService;
  }

  @PostMapping("/login")
  public AuthResponse login(@RequestBody LoginRequest request, jakarta.servlet.http.HttpServletRequest http) {
    customers.rate("legacy-ip:"+http.getRemoteAddr(),60);
    customers.rate("legacy-login:"+String.valueOf(request.username()).trim().toLowerCase(java.util.Locale.ROOT),10);
    return authService.authenticate(request);
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public Object register(@Valid @RequestBody com.metaarch.orgaccess.customer.CustomerAuthController.Signup request) {
    return customers.register(request);
  }

  @GetMapping("/validate")
  public AuthValidationResponse validate(Authentication authentication) {
    return authService.validationResponse(authentication);
  }

  @GetMapping("/me")
  public AuthValidationResponse me(Authentication authentication) {
    return authService.validationResponse(authentication);
  }
}
