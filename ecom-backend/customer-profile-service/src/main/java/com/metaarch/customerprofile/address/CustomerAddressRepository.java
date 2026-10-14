package com.metaarch.customerprofile.address;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
interface CustomerAddressRepository extends JpaRepository<CustomerAddress,UUID>{List<CustomerAddress> findAllByUsernameOrderByDefaultAddressDescCreatedAtAsc(String username); Optional<CustomerAddress> findByIdAndUsername(UUID id,String username); long countByUsername(String username);}
