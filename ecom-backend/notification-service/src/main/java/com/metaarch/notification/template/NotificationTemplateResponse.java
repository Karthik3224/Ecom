package com.metaarch.notification.template;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.notification.notification.*;

public record NotificationTemplateResponse(
  UUID id,
  String name,
  NotificationType notificationType,
  NotificationChannel channel,
  String subjectTemplate,
  String messageTemplate,
  TemplateStatus status,
  Instant createdAt,
  Instant updatedAt
) {
  public static NotificationTemplateResponse from(NotificationTemplate template) {
    return new NotificationTemplateResponse(
      template.getId(),
      template.getName(),
      template.getNotificationType(),
      template.getChannel(),
      template.getSubjectTemplate(),
      template.getMessageTemplate(),
      template.getStatus(),
      template.getCreatedAt(),
      template.getUpdatedAt());
  }
}
