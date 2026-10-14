package com.metaarch.notification.notification;

import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
  Optional<Notification> findBySourceEventId(UUID sourceEventId);
  Page<Notification> findByCustomerId(UUID customerId, Pageable pageable);
  Page<Notification> findByOrderId(UUID orderId, Pageable pageable);
}
