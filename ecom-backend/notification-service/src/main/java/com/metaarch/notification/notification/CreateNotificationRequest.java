package com.metaarch.notification.notification;

import java.util.UUID;
import jakarta.validation.constraints.*;

public record CreateNotificationRequest(
  @NotNull UUID customerId,
  UUID orderId,
  @NotNull NotificationType notificationType,
  @NotNull NotificationChannel channel,
  @Size(max = 255) String recipient,
  @NotBlank @Size(max = 255) String subject,
  @NotBlank @Size(max = 10000) String message
) { }
