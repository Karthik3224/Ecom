package com.metaarch.catalog.store;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreDeliveryMethodRepository extends JpaRepository<StoreDeliveryMethod, Long> {
  List<StoreDeliveryMethod> findByStoreIdOrderByDeliveryTypeAsc(String storeId);
  List<StoreDeliveryMethod> findByZoneIdOrderByDeliveryTypeAsc(Long zoneId);
  void deleteByZoneId(Long zoneId);
}
