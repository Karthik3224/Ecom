package com.metaarch.orgaccess.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.metaarch.orgaccess.audit.AuditLogRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class IdentityServiceTest {
  private final UserAccountRepository users = mock(UserAccountRepository.class);
  private final MembershipRepository memberships = mock(MembershipRepository.class);
  private final RoleRepository roles = mock(RoleRepository.class);
  private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
  private final AuditLogRepository auditLogs = mock(AuditLogRepository.class);
  private final JdbcTemplate customerDb = mock(JdbcTemplate.class);
  private IdentityService service;

  @BeforeEach
  void setUp() {
    service = new IdentityService(users, memberships, roles, passwordEncoder, auditLogs);
    ReflectionTestUtils.setField(service, "customerDb", customerDb);
  }

  @Test
  void requiresAnEnabledUnlockedUser() {
    UserAccount user = user("alice");
    when(users.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(user));

    assertThat(service.requireUser("alice")).isSameAs(user);
  }

  @Test
  void rejectsMissingDisabledAndLockedUsers() {
    when(users.findByUsernameIgnoreCase("missing")).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.requireUser("missing"))
        .isInstanceOf(org.springframework.security.core.userdetails.UsernameNotFoundException.class);

    UserAccount disabled = user("disabled");
    disabled.setEnabled(false);
    when(users.findByUsernameIgnoreCase("disabled")).thenReturn(Optional.of(disabled));
    assertThatThrownBy(() -> service.requireUser("disabled"))
        .isInstanceOf(org.springframework.security.core.userdetails.UsernameNotFoundException.class);

    UserAccount locked = user("locked");
    locked.setLocked(true);
    when(users.findByUsernameIgnoreCase("locked")).thenReturn(Optional.of(locked));
    assertThatThrownBy(() -> service.requireUser("locked"))
        .isInstanceOf(org.springframework.security.core.userdetails.UsernameNotFoundException.class);
  }

  @Test
  void combinesRolePermissionAndMembershipScopeAuthorities() {
    UserAccount user = user("manager");
    Role role = role("STORE_MANAGER", "ORDER_READ");
    user.getRoles().add(role);
    Membership membership = new Membership();
    membership.setRole(role("DELIVERY_PARTNER", "DELIVERY_READ"));
    membership.setOrganizationId("org-1");
    membership.setLocationId("loc-1");
    membership.setStoreId("store-1");
    when(memberships.findByUserUsernameIgnoreCase("manager")).thenReturn(List.of(membership));

    assertThat(service.authorities(user)).containsExactlyInAnyOrder(
        new SimpleGrantedAuthority("ROLE_STORE_MANAGER"),
        new SimpleGrantedAuthority("PERM_ORDER_READ"),
        new SimpleGrantedAuthority("ROLE_DELIVERY_PARTNER"),
        new SimpleGrantedAuthority("PERM_DELIVERY_READ"),
        new SimpleGrantedAuthority("SCOPE_ORGANIZATION:org-1"),
        new SimpleGrantedAuthority("SCOPE_LOCATION:loc-1"),
        new SimpleGrantedAuthority("SCOPE_STORE:store-1"));
  }

  @Test
  void provisionsOAuthUserWithStableDefaults() {
    when(users.findByOauthSubject("subject-1")).thenReturn(Optional.empty());
    when(users.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

    UserAccount result = service.provisionOAuthUser("subject-1", null, null);

    assertThat(result.getOauthSubject()).isEqualTo("subject-1");
    assertThat(result.getEmail()).isEqualTo("subject-1@oauth.local");
    assertThat(result.getUsername()).isEqualTo("subject-1@oauth.local");
    verify(auditLogs).save(any());
  }

  @Test
  void changesPasswordOnlyAfterVerifyingCurrentPassword() {
    UserAccount user = user("alice");
    user.setPasswordHash("old-hash");
    when(users.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("old", "old-hash")).thenReturn(true);
    when(passwordEncoder.encode("new")).thenReturn("new-hash");

    service.changePassword("alice", "old", "new");

    assertThat(user.getPasswordHash()).isEqualTo("new-hash");
    verify(auditLogs).save(any());
  }

  @Test
  void doesNotChangePasswordWhenCurrentPasswordIsWrong() {
    UserAccount user = user("alice");
    user.setPasswordHash("old-hash");
    when(users.findByUsernameIgnoreCase("alice")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

    assertThatThrownBy(() -> service.changePassword("alice", "wrong", "new"))
        .isInstanceOf(IllegalArgumentException.class);
    assertThat(user.getPasswordHash()).isEqualTo("old-hash");
  }

  @Test
  void rejectsDuplicateUsersBeforePersistingAnything() {
    when(users.existsByUsernameIgnoreCase("alice")).thenReturn(true);
    UserCreateRequest request = new UserCreateRequest(" alice ", "alice@example.com", "password", "CUSTOMER",
        null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

    assertThatThrownBy(() -> service.create(request, "admin"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Username or email already exists");
  }

  @Test
  void rejectsUnknownRolesBeforeWritingCustomerData() {
    when(users.existsByUsernameIgnoreCase("alice")).thenReturn(false);
    when(users.existsByEmailIgnoreCase("alice@example.com")).thenReturn(false);
    when(roles.findByName("CUSTOMER")).thenReturn(Optional.empty());
    UserCreateRequest request = new UserCreateRequest("alice", "alice@example.com", "password", "ROLE_CUSTOMER",
        null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

    assertThatThrownBy(() -> service.create(request, "admin"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Unknown role");
  }

  private static UserAccount user(String username) {
    UserAccount user = new UserAccount();
    user.setUsername(username);
    user.setEmail(username + "@example.com");
    return user;
  }

  private static Role role(String name, String permissionCode) {
    Role role = new Role();
    role.setName(name);
    Permission permission = new Permission();
    permission.setCode(permissionCode);
    role.getPermissions().add(permission);
    return role;
  }
}
