package com.metaarch.orgaccess.identity;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service("scopeAuthorization")
public class ScopeAuthorizationService {
  public boolean allowed(Authentication authentication, String organizationId, String locationId, String storeId) {
    if (authentication == null) return false;
    if (authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_GLOBAL_ADMIN"))) return true;
    return has(authentication, "ORGANIZATION", organizationId) || has(authentication, "LOCATION", locationId) || has(authentication, "STORE", storeId);
  }
  private boolean has(Authentication authentication, String type, String value) {
    return value != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SCOPE_" + type + ":" + value));
  }
}
