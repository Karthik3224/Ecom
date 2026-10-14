package com.metaarch.orgaccess.identity;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/delivery-partners")
@PreAuthorize("hasAnyRole('STORE_MANAGER','LOCATION_ADMIN','GLOBAL_ADMIN','SUPER_ADMIN')")
public class DeliveryPartnerController {
  private final JdbcTemplate jdbc;
  private final UserAccountRepository users;
  private final MembershipRepository memberships;
  private final RoleRepository roles;
  private final PasswordEncoder passwords;
  public DeliveryPartnerController(JdbcTemplate jdbc, UserAccountRepository users, MembershipRepository memberships,
      RoleRepository roles, PasswordEncoder passwords) {
    this.jdbc=jdbc; this.users=users; this.memberships=memberships; this.roles=roles; this.passwords=passwords;
  }
  private List<Membership> scope(Authentication auth) {
    return memberships.findByUserUsernameIgnoreCase(auth.getName());
  }
  private boolean global(Authentication auth) {
    return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GLOBAL_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
  }
  private boolean allowed(Authentication auth, String store, String location) {
    if (global(auth)) return true;
    return scope(auth).stream().anyMatch(m ->
      ("STORE_MANAGER".equals(m.getRole().getName()) && store != null && !store.isBlank() && store.equals(m.getStoreId())) ||
      ("LOCATION_ADMIN".equals(m.getRole().getName()) && location != null && !location.isBlank() && location.equals(m.getLocationId())));
  }
  @GetMapping
  @Transactional(readOnly=true)
  public List<Map<String,Object>> list(Authentication auth) {
    return jdbc.queryForList("""
      SELECT DISTINCT CAST(u.id AS CHAR) AS id, u.username, u.email, u.display_name AS name,
        u.mobile, u.mobile AS phone, u.status, (u.enabled AND NOT u.locked AND u.status = 'Active') AS active,
        u.vehicle_type AS vehicleType, u.vehicle_number AS vehicleNumber, u.licence_number AS licenceNumber,
        u.address, m.store_id AS storeId, m.store_name AS store, m.location_id AS location
      FROM users u JOIN memberships m ON m.user_id=u.id JOIN roles r ON r.id=m.role_id
      WHERE r.name='DELIVERY_PARTNER' ORDER BY u.display_name
      """).stream().filter(row -> allowed(auth, (String)row.get("storeId"), (String)row.get("location"))).toList();
  }
  public record CreateRequest(
      @NotBlank @Size(max=180) String name, @NotBlank @Pattern(regexp="[+0-9 ()-]{7,30}") String mobile,
      @NotBlank @Size(max=190) String username, @NotBlank @Email @Size(max=255) String email,
      @NotBlank @Size(min=8,max=100) String password,
      @NotBlank @Size(max=40) String vehicleType, @NotBlank @Size(max=40) String vehicleNumber,
      @NotBlank @Size(max=60) String licenceNumber, @Size(max=700) String address,
      @NotNull Boolean active) {}
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('STORE_MANAGER')")
  @Transactional
  public Map<String,Object> create(@Valid @RequestBody CreateRequest request, Authentication auth) {
    Membership manager=scope(auth).stream().filter(m -> "STORE_MANAGER".equals(m.getRole().getName()) && m.getStoreId()!=null && !m.getStoreId().isBlank())
      .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,"No store is assigned to this manager."));
    if(users.existsByUsernameIgnoreCase(request.username().trim()) || users.existsByEmailIgnoreCase(request.email().trim()))
      throw new ResponseStatusException(HttpStatus.CONFLICT,"Username or email already exists.");
    Role role=roles.findByName("DELIVERY_PARTNER").orElseThrow();
    UserAccount user=new UserAccount();
    user.setUsername(request.username().trim()); user.setEmail(request.email().trim());
    user.setDisplayName(request.name().trim()); user.setMobile(request.mobile().trim());
    user.setPasswordHash(passwords.encode(request.password()));
    user.setVehicleType(request.vehicleType().trim()); user.setVehicleNumber(request.vehicleNumber().trim());
    user.setLicenceNumber(request.licenceNumber().trim()); user.setAddress(request.address());
    user.setEnabled(true); user.setStatus(request.active()?"Active":"Inactive");
    user.getRoles().add(role); users.saveAndFlush(user);
    Membership membership=new Membership(); membership.setUser(user); membership.setRole(role);
    membership.setOrganizationId(manager.getOrganizationId()); membership.setLocationId(manager.getLocationId());
    membership.setStoreId(manager.getStoreId()); membership.setStoreName(manager.getStoreName());
    membership.setStoreLocation(manager.getStoreLocation()); membership.setStoreAddress(manager.getStoreAddress());
    membership.setAssignedBy(auth.getName()); memberships.saveAndFlush(membership);
    return list(auth).stream().filter(row -> user.getId().toString().equals(row.get("id"))).findFirst().orElseThrow();
  }
  public record StatusRequest(@NotNull Boolean active) {}
  @PutMapping("/{id}/status")
  @Transactional
  public Map<String,Object> status(@PathVariable Long id, @Valid @RequestBody StatusRequest request, Authentication auth) {
    if(list(auth).stream().noneMatch(row -> id.toString().equals(row.get("id"))))
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Delivery partner not found in your assigned scope.");
    UserAccount user=users.findById(id).orElseThrow();
    user.setEnabled(true); user.setStatus(request.active()?"Active":"Inactive");
    users.saveAndFlush(user);
    return list(auth).stream().filter(row -> id.toString().equals(row.get("id"))).findFirst().orElseThrow();
  }
}
