package com.metaarch.fulfillment.tracking;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackingEventRepository extends JpaRepository<TrackingEvent, UUID> {
  List<TrackingEvent> findByShipment_IdOrderByEventTimeAsc(UUID shipmentId);
}
