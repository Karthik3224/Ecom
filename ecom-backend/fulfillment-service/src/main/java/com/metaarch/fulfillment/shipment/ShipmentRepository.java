package com.metaarch.fulfillment.shipment;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
  Optional<Shipment> findByOrderId(UUID orderId);
  List<Shipment> findAllByDeliveryPartnerId(String deliveryPartnerId);
  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select s from Shipment s where s.id = :id")
  Optional<Shipment> findForUpdate(@org.springframework.data.repository.query.Param("id") UUID id);
  boolean existsByTrackingNumber(String trackingNumber);
}
