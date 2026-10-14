package com.metaarch.orgaccess.identity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class ScopeAuthorizationServiceTest {
  private final ScopeAuthorizationService service = new ScopeAuthorizationService();

  @Test
  void allowsMatchingScopeAndRejectsOtherScope() {
    var authentication = new UsernamePasswordAuthenticationToken("user", null,
        List.of(new SimpleGrantedAuthority("ROLE_STORE_MANAGER"),
            new SimpleGrantedAuthority("SCOPE_STORE:store-7")));
    assertThat(service.allowed(authentication, null, null, "store-7")).isTrue();
    assertThat(service.allowed(authentication, null, null, "store-8")).isFalse();
  }

  @Test
  void globalAdminBypassesScope() {
    var authentication = new UsernamePasswordAuthenticationToken("admin", null,
        List.of(new SimpleGrantedAuthority("ROLE_GLOBAL_ADMIN")));
    assertThat(service.allowed(authentication, "org-1", "loc-1", "store-1")).isTrue();
  }
}
