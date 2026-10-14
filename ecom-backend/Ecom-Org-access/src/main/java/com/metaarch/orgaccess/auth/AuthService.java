package com.metaarch.orgaccess.auth;

import com.metaarch.orgaccess.security.JwtProperties;
import com.metaarch.orgaccess.security.JwtTokenProvider;
import com.metaarch.orgaccess.identity.IdentityService;
import com.metaarch.orgaccess.identity.UserAccount;
import java.util.List;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;
  private final JwtProperties jwtProperties;
  private final IdentityService identities;

  public AuthService(
    AuthenticationManager authenticationManager,
    JwtTokenProvider jwtTokenProvider,
    JwtProperties jwtProperties,
    IdentityService identities
  ) {
    this.authenticationManager = authenticationManager;
    this.jwtTokenProvider = jwtTokenProvider;
    this.jwtProperties = jwtProperties;
    this.identities = identities;
  }

  public AuthResponse authenticate(LoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
      new UsernamePasswordAuthenticationToken(request.username(), request.password())
    );
    List<String> roles = extractRoles(authentication);
    UserAccount user = identities.requireUser(authentication.getName());
    String token = jwtTokenProvider.generateToken(user);
    return new AuthResponse(token, authentication.getName(), roles, jwtProperties.getExpirationMillis());
  }

  public AuthValidationResponse validationResponse(Authentication authentication) {
    return new AuthValidationResponse(authentication.getName(), extractRoles(authentication), true);
  }

  private List<String> extractRoles(Authentication authentication) {
    return authentication.getAuthorities()
      .stream()
      .map(GrantedAuthority::getAuthority)
      .toList();
  }
}
