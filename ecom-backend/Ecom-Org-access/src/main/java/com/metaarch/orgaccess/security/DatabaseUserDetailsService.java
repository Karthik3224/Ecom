package com.metaarch.orgaccess.security;

import com.metaarch.orgaccess.identity.IdentityService;
import com.metaarch.orgaccess.identity.UserAccount;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
  private final IdentityService identities;
  public DatabaseUserDetailsService(IdentityService identities) { this.identities = identities; }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    UserAccount user = identities.requireUser(username);
    return User.withUsername(user.getUsername())
        .password(user.getPasswordHash() == null ? "{noop}" : user.getPasswordHash())
        .authorities(identities.authorities(user))
        .disabled(!user.isEnabled())
        .accountLocked(user.isLocked())
        .build();
  }
}
