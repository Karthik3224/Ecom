package com.metaarch.orgaccess.identity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class DeliveryPartnerControllerTest {
  @Test void managerCannotListOrUpdateAnotherStoresPartners() {
    JdbcTemplate jdbc=mock(JdbcTemplate.class);
    UserAccountRepository users=mock(UserAccountRepository.class);
    MembershipRepository memberships=mock(MembershipRepository.class);
    Role role=new Role(); role.setName("STORE_MANAGER");
    Membership scope=new Membership(); scope.setRole(role); scope.setStoreId("store-a");
    when(memberships.findByUserUsernameIgnoreCase("manager")).thenReturn(List.of(scope));
    when(jdbc.queryForList(anyString())).thenReturn(List.of(
      Map.of("id","1","storeId","store-a","location","city"),
      Map.of("id","2","storeId","store-b","location","city")));
    var controller=new DeliveryPartnerController(jdbc,users,memberships,mock(RoleRepository.class),mock(PasswordEncoder.class));
    var auth=new UsernamePasswordAuthenticationToken("manager","",List.of(new SimpleGrantedAuthority("ROLE_STORE_MANAGER")));
    assertEquals(List.of("1"),controller.list(auth).stream().map(row -> row.get("id")).toList());
    var request = new DeliveryPartnerController.StatusRequest(false);
    assertThrows(ResponseStatusException.class,() -> controller.status(2L,request,auth));
    verifyNoInteractions(users);
  }
  @Test void managerWithoutStoreCannotCreatePartner() {
    var memberships=mock(MembershipRepository.class);
    when(memberships.findByUserUsernameIgnoreCase("manager")).thenReturn(List.of());
    var users=mock(UserAccountRepository.class);
    var controller=new DeliveryPartnerController(mock(JdbcTemplate.class),users,memberships,mock(RoleRepository.class),mock(PasswordEncoder.class));
    var auth=new UsernamePasswordAuthenticationToken("manager","",List.of(new SimpleGrantedAuthority("ROLE_STORE_MANAGER")));
    assertThrows(ResponseStatusException.class,() -> controller.create(null,auth));
    verifyNoInteractions(users);
  }
}
