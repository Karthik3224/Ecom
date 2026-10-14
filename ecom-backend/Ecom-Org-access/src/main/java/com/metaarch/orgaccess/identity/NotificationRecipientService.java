package com.metaarch.orgaccess.identity;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationRecipientService {
  private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private final MembershipRepository memberships;

  public NotificationRecipientService(MembershipRepository memberships) {
    this.memberships = memberships;
  }

  @Transactional(readOnly = true)
  public List<String> findEmails(String storeId, String locationId) {
    Set<String> emails = new LinkedHashSet<>();
    addEmails(emails, memberships.findByStoreIdIgnoreCaseAndRole_Name(storeId.trim(), "STORE_MANAGER"));
    addEmails(emails, memberships.findByLocationIdIgnoreCaseAndRole_Name(locationId.trim(), "LOCATION_ADMIN"));
    return new ArrayList<>(emails);
  }

  private void addEmails(Set<String> emails, List<Membership> rows) {
    for (Membership membership : rows) {
      if (membership.getUser() == null || membership.getUser().getEmail() == null) continue;
      String email = membership.getUser().getEmail().trim().toLowerCase(Locale.ROOT);
      if (EMAIL.matcher(email).matches()) emails.add(email);
    }
  }
}
