package com.metaarch.order.order;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class StoreManagerAccessTest {
  @AfterEach void clear() { SecurityContextHolder.clearContext(); }
  private void login(String type, String... roles) {
    var jwt = Jwt.withTokenValue("verified-test-token").header("alg", "HS512").subject("manager")
        .claim("accountType", type).build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt,
        java.util.Arrays.stream(roles).map(SimpleGrantedAuthority::new).toList()));
  }
  @Test void managerOnlyReadsAndMutatesAssignedStore() {
    var orders = mock(OrderRepository.class);
    var order = mock(Order.class);
    var id = UUID.randomUUID();
    when(orders.findById(id)).thenReturn(Optional.of(order));
    when(order.getStoreId()).thenReturn("store-a");
    when(order.getCustomerId()).thenReturn(UUID.randomUUID());
    var access = new OrderAccess(orders);
    login("staff", "ROLE_STORE_MANAGER", "SCOPE_STORE:store-a");
    assertThat(access.store("store-a")).isTrue();
    assertThat(access.owner(id)).isTrue();
    assertThat(access.manage(id)).isTrue();
    assertThat(access.store("store-b")).isFalse();
    assertThat(access.store(null)).isFalse();
    when(order.getStoreId()).thenReturn("store-b");
    assertThat(access.owner(id)).isFalse();
    assertThat(access.manage(id)).isFalse();
  }
  @Test void roleOrScopeAloneAndCustomerTokensCannotGrantManagerAccess() {
    var access = new OrderAccess(mock(OrderRepository.class));
    for (var roles : List.of(new String[]{"ROLE_STORE_MANAGER"}, new String[]{"SCOPE_STORE:store-a"})) {
      login("staff", roles);
      assertThat(access.store("store-a")).isFalse();
    }
    login("customer", "ROLE_STORE_MANAGER", "SCOPE_STORE:store-a");
    assertThat(access.store("store-a")).isFalse();
    assertThat(access.manage(UUID.randomUUID())).isFalse();
    SecurityContextHolder.clearContext();
    assertThat(access.store("store-a")).isFalse();
  }
  @Test void deliveryRoleDoesNotGrantStoreOrMutationAccess() {
    var access=new OrderAccess(mock(OrderRepository.class));
    login("staff","ROLE_DELIVERY_PARTNER","SCOPE_STORE:store-a");
    assertThat(access.store("store-a")).isFalse();
    assertThat(access.owner(UUID.randomUUID())).isFalse();
    assertThat(access.manage(UUID.randomUUID())).isFalse();
    assertThat(access.read(UUID.randomUUID())).isFalse();
  }
}
