package com.metaarch.orgaccess.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.metaarch.orgaccess.identity.IdentityService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class JwtTokenProviderTest {
  @Test
  void createsAndReadsAnApplicationToken() {
    JwtProperties properties = properties();
    JwtTokenProvider provider = new JwtTokenProvider(properties, mock(IdentityService.class), mock(JdbcTemplate.class));

    String token = provider.generateToken("alice", List.of("ROLE_CUSTOMER", "PERM_ORDER_READ"));

    assertThat(provider.getUsername(token)).isEqualTo("alice");
    assertThat(provider.getRoles(token)).containsExactly("ROLE_CUSTOMER", "PERM_ORDER_READ");
    assertThat(provider.isCustomerToken(token)).isFalse();
    assertThat(provider.getExpiration(token)).isAfter(Instant.now());
  }

  @Test
  void createsCustomerTokenFromAnEnabledCustomerRecord() {
    JwtProperties properties = properties();
    JdbcTemplate db = mock(JdbcTemplate.class);
    when(db.queryForMap("SELECT BIN_TO_UUID(id) AS customerId,token_version,enabled,locked FROM app_customers WHERE username=?", "alice"))
        .thenReturn(java.util.Map.of("customerId", "customer-1", "token_version", 2L, "enabled", true, "locked", false));
    JwtTokenProvider provider = new JwtTokenProvider(properties, mock(IdentityService.class), db);

    String token = provider.generateCustomerToken("alice");

    assertThat(provider.getUsername(token)).isEqualTo("alice");
    assertThat(provider.isCustomerToken(token)).isTrue();
    assertThat(provider.getRoles(token)).containsExactly("ROLE_CUSTOMER");
  }

  private static JwtProperties properties() {
    JwtProperties properties = new JwtProperties();
    properties.setSecret("0123456789012345678901234567890123456789");
    properties.setExpirationMillis(60_000);
    return properties;
  }
}
