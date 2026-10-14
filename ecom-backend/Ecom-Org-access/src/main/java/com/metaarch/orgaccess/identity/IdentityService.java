package com.metaarch.orgaccess.identity;

import com.metaarch.orgaccess.audit.AuditLog;
import com.metaarch.orgaccess.audit.AuditLogRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdentityService {
  private final UserAccountRepository users;
  private final MembershipRepository memberships;
  private final RoleRepository roles;
  private final PasswordEncoder passwordEncoder;
  private final AuditLogRepository auditLogs;
  @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate customerDb;

  public IdentityService(UserAccountRepository users, MembershipRepository memberships,
      RoleRepository roles, PasswordEncoder passwordEncoder, AuditLogRepository auditLogs) {
    this.users = users; this.memberships = memberships; this.roles = roles;
    this.passwordEncoder = passwordEncoder; this.auditLogs = auditLogs;
  }

  @Transactional(readOnly = true)
  public UserAccount requireUser(String username) {
    UserAccount user = users.findByUsernameIgnoreCase(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    if (!user.isEnabled() || user.isLocked()) {
      throw new UsernameNotFoundException("User is disabled or locked: " + username);
    }
    return user;
  }

  @Transactional(readOnly = true)
  public List<GrantedAuthority> authorities(UserAccount user) {
    Set<GrantedAuthority> result = new HashSet<>();
    user.getRoles().forEach(role -> addRole(result, role));
    memberships.findByUserUsernameIgnoreCase(user.getUsername()).forEach(membership -> {
      addRole(result, membership.getRole());
      addScope(result, "ORGANIZATION", membership.getOrganizationId());
      addScope(result, "LOCATION", membership.getLocationId());
      addScope(result, "STORE", membership.getStoreId());
    });
    return result.stream().toList();
  }

  @Transactional
  public UserAccount provisionOAuthUser(String subject, String email, String name) {
    UserAccount user = users.findByOauthSubject(subject).orElseGet(() -> {
      UserAccount created = new UserAccount();
      created.setOauthSubject(subject);
      created.setEmail(email == null || email.isBlank() ? subject + "@oauth.local" : email);
      created.setUsername(name == null || name.isBlank() ? created.getEmail() : name);
      return created;
    });
    user.setOauthSubject(subject);
    if (email != null && !email.isBlank()) user.setEmail(email);
    users.save(user);
    auditLogs.save(new AuditLog(user.getUsername(), "OAUTH2_LOGIN", user.getUsername()));
    return user;
  }

  @Transactional
  public UserAccount create(UserCreateRequest request, String actor) {
    String username = clean(request.username());
    String email = clean(request.email());
    String roleName = normalizeRole(request.role());
    if (users.existsByUsernameIgnoreCase(username) || users.existsByEmailIgnoreCase(email)) {
      throw new IllegalArgumentException("Username or email already exists");
    }
    Role role = roles.findByName(roleName).orElseThrow(() -> new IllegalArgumentException("Unknown role"));
    UserAccount user = new UserAccount();
    user.setUsername(username); user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setDisplayName(blank(request.name()));
    user.setMobile(blank(request.mobile()));
    user.setStatus(status(request.status()));
    user.setEnabled(!"Blocked".equalsIgnoreCase(user.getStatus()));
    user.setLocked("Blocked".equalsIgnoreCase(user.getStatus()));
    user.getRoles().add(role);
    UserAccount saved = users.save(user);
    users.flush();
    customerDb.update("INSERT INTO customer_contact_claims(contact,user_id) VALUES(?,?)","email:"+email.toLowerCase(java.util.Locale.ROOT),saved.getId());
    if (saved.getMobile()!=null) customerDb.update("INSERT INTO customer_contact_claims(contact,user_id) VALUES(?,?)","mobile:"+com.metaarch.orgaccess.customer.CustomerAuthService.mobile(saved.getMobile()).substring(1),saved.getId());
    if (roleName.equals("CUSTOMER")) {
      users.flush();
      customerDb.update("INSERT INTO customers(id,user_id,full_name) VALUES(UNHEX(REPLACE(UUID(),'-','')),?,?)",saved.getId(),request.name()==null?username:request.name());
    }
    saveMembership(saved, role, request, actor);
    auditLogs.save(new AuditLog(actor, "CREATE_USER", saved.getUsername()));
    return saved;
  }

  @Transactional
  public void changePassword(String username, String currentPassword, String newPassword) {
    UserAccount user = requireUser(username);
    if (user.getPasswordHash() == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
      throw new IllegalArgumentException("Current password is incorrect");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    auditLogs.save(new AuditLog(username, "CHANGE_PASSWORD", username));
  }

  private void saveMembership(UserAccount user, Role role, UserCreateRequest request, String actor) {
    String organizationId = blank(request.organizationId());
    String locationId = blank(request.location());
    String storeId = blank(request.storeId());
    String storeName = blank(request.store());
    if (organizationId == null && locationId == null && storeId == null && storeName == null) return;
    Membership membership = new Membership();
    membership.setUser(user);
    membership.setRole(role);
    membership.setOrganizationId(organizationId == null ? "metaarch-commerce" : organizationId);
    membership.setLocationId(locationId);
    membership.setStoreId(storeId);
    membership.setStoreName(storeName);
    membership.setStoreLocation(blank(request.storeLocation()));
    membership.setStoreAddress(blank(request.storeAddress()));
    membership.setLatitude(request.latitude());
    membership.setLongitude(request.longitude());
    membership.setProvider(blank(request.provider()));
    membership.setProviderPlaceId(blank(request.providerPlaceId()));
    membership.setProviderOsmType(blank(request.providerOsmType()));
    membership.setProviderOsmId(blank(request.providerOsmId()));
    membership.setLocationAccuracyMeters(request.locationAccuracyMeters());
    membership.setAssignedBy(blank(request.assignedBy()) == null ? actor : blank(request.assignedBy()));
    memberships.save(membership);
  }

  private String normalizeRole(String value) {
    return clean(value).replace('-', '_').replace("ROLE_", "").toUpperCase(Locale.ROOT);
  }

  private String status(String value) {
    String status = blank(value);
    return status == null ? "Active" : status;
  }

  private String clean(String value) {
    if (value == null) throw new IllegalArgumentException("Required value is missing");
    return value.trim();
  }

  private String blank(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private void addRole(Set<GrantedAuthority> result, Role role) {
    result.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
    role.getPermissions().forEach(permission -> result.add(new SimpleGrantedAuthority("PERM_" + permission.getCode())));
  }

  private void addScope(Set<GrantedAuthority> result, String type, String value) {
    if (value != null && !value.isBlank()) result.add(new SimpleGrantedAuthority("SCOPE_" + type + ":" + value));
  }
}
