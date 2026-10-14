package com.metaarch.notification.template;

import com.metaarch.notification.notification.*;
import jakarta.validation.constraints.*;

public record NotificationTemplateRequest(
  @NotBlank @Size(max = 120) String name,
  @NotNull NotificationType notificationType,
  @NotNull NotificationChannel channel,
  @NotBlank @Size(max = 255) String subjectTemplate,
  @NotBlank @Size(max = 10000) String messageTemplate,
  @NotNull TemplateStatus status
) { }
