package com.metaarch.notification.notification;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationStatusRequest(@NotNull NotificationStatus status) { }
