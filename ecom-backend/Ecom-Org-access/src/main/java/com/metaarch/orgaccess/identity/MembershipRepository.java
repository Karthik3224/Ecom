package com.metaarch.orgaccess.identity;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
  @EntityGraph(attributePaths = {"role", "role.permissions"})
  List<Membership> findByUserUsernameIgnoreCase(String username);

  @EntityGraph(attributePaths = {"user", "role"})
  List<Membership> findByStoreIdIgnoreCaseAndRole_Name(String storeId, String roleName);

  @EntityGraph(attributePaths = {"user", "role"})
  List<Membership> findByLocationIdIgnoreCaseAndRole_Name(String locationId, String roleName);
}
