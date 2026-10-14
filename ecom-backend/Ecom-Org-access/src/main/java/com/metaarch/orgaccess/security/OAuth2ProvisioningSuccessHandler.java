package com.metaarch.orgaccess.security;

import com.metaarch.orgaccess.identity.IdentityService;
import com.metaarch.orgaccess.identity.UserAccount;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2ProvisioningSuccessHandler implements AuthenticationSuccessHandler {
  private final IdentityService identities;
  private final JwtTokenProvider tokens;
  public OAuth2ProvisioningSuccessHandler(IdentityService identities, JwtTokenProvider tokens) {
    this.identities = identities; this.tokens = tokens;
  }
  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {
    OAuth2User oauth = (OAuth2User) authentication.getPrincipal();
    String subject = oauth.getAttribute("sub");
    String email = oauth.getAttribute("email");
    String name = oauth.getAttribute("preferred_username");
    if (name == null) name = oauth.getAttribute("name");
    UserAccount user = identities.provisionOAuthUser(subject, email, name);
    response.setContentType("application/json");
    response.getWriter().write("{\"token\":\"" + tokens.generateToken(user) + "\",\"username\":\"" + user.getUsername() + "\"}");
  }
}
