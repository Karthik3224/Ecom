package com.metaarch.notification.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
  UUID id,
  UUID customerId,
  UUID orderId,
  NotificationType notificationType,
  NotificationChannel channel,
  String recipient,
  String subject,
  String message,
  NotificationStatus status,
  UUID sourceEventId,
  String failureReason,
  Instant sentAt,
  Instant createdAt,
  Instant updatedAt
) {
  public static NotificationResponse from(Notification notification) {
    return new NotificationResponse(
      notification.getId(),
      notification.getCustomerId(),
      notification.getOrderId(),
      notification.getNotificationType(),
      notification.getChannel(),
      notification.getRecipient(),
      notification.getSubject(),
      notification.getMessage(),
      notification.getStatus(),
      notification.getSourceEventId(),
      notification.getFailureReason(),
      notification.getSentAt(),
      notification.getCreatedAt(),
      notification.getUpdatedAt());
  }
}
