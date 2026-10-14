package com.metaarch.catalog.store;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreDeliveryZoneRepository extends JpaRepository<StoreDeliveryZone, Long> {
  List<StoreDeliveryZone> findByStoreIdOrderByMinRadiusKmAsc(String storeId);
}
