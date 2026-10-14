package com.metaarch.customerprofile.profile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
interface CustomerProfileRepository extends JpaRepository<CustomerProfile, UUID> { Optional<CustomerProfile> findByUsername(String username); }
