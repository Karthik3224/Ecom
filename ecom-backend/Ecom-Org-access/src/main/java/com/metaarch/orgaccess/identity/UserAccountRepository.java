package com.metaarch.orgaccess.identity;

import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  @EntityGraph(attributePaths = {"roles", "roles.permissions"})
  Optional<UserAccount> findByUsernameIgnoreCase(String username);
  @EntityGraph(attributePaths = {"roles", "roles.permissions"})
  Optional<UserAccount> findByOauthSubject(String oauthSubject);
  boolean existsByUsernameIgnoreCase(String username);
  boolean existsByEmailIgnoreCase(String email);
}
