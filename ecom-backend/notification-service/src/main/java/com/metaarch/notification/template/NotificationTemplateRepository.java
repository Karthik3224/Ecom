package com.metaarch.notification.template;

import java.util.*;
import com.metaarch.notification.notification.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {
  Optional<NotificationTemplate> findByNotificationTypeAndChannelAndStatus(NotificationType notificationType, NotificationChannel channel, TemplateStatus status);
  boolean existsByNotificationTypeAndChannelAndStatus(NotificationType notificationType, NotificationChannel channel, TemplateStatus status);
  boolean existsByNotificationTypeAndChannelAndStatusAndIdNot(NotificationType notificationType, NotificationChannel channel, TemplateStatus status, UUID id);
}
