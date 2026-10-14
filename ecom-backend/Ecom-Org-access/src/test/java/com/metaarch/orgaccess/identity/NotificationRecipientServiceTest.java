package com.metaarch.orgaccess.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class NotificationRecipientServiceTest {
  private final MembershipRepository memberships = mock(MembershipRepository.class);
  private final NotificationRecipientService service = new NotificationRecipientService(memberships);

  @Test
  void returnsManagerAndLocationAdminEmails() {
    when(memberships.findByStoreIdIgnoreCaseAndRole_Name("store-1", "STORE_MANAGER"))
      .thenReturn(List.of(membership("manager@example.com", "STORE_MANAGER")));
    when(memberships.findByLocationIdIgnoreCaseAndRole_Name("hyderabad", "LOCATION_ADMIN"))
      .thenReturn(List.of(membership("admin@example.com", "LOCATION_ADMIN")));

    assertThat(service.findEmails("store-1", "hyderabad"))
      .containsExactly("manager@example.com", "admin@example.com");
  }

  @Test
  void removesDuplicateAndIgnoresBlankNullAndInvalidEmails() {
    when(memberships.findByStoreIdIgnoreCaseAndRole_Name("store-1", "STORE_MANAGER"))
      .thenReturn(List.of(membership("Manager@Example.com", "STORE_MANAGER"), membership(" ", "STORE_MANAGER"), membership(null, "STORE_MANAGER"), membership("not-an-email", "STORE_MANAGER")));
    when(memberships.findByLocationIdIgnoreCaseAndRole_Name("hyderabad", "LOCATION_ADMIN"))
      .thenReturn(List.of(membership("manager@example.com", "LOCATION_ADMIN")));

    assertThat(service.findEmails("store-1", "hyderabad")).containsExactly("manager@example.com");
  }

  @Test
  void returnsEmptyWhenNoMatchingMembershipsExist() {
    when(memberships.findByStoreIdIgnoreCaseAndRole_Name("store-1", "STORE_MANAGER")).thenReturn(List.of());
    when(memberships.findByLocationIdIgnoreCaseAndRole_Name("unknown", "LOCATION_ADMIN")).thenReturn(List.of());

    assertThat(service.findEmails("store-1", "unknown")).isEmpty();
  }

  private Membership membership(String email, String roleName) {
    UserAccount user = new UserAccount();
    user.setEmail(email);
    Role role = new Role();
    role.setName(roleName);
    Membership membership = new Membership();
    membership.setUser(user);
    membership.setRole(role);
    return membership;
  }
}
