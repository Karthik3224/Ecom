package com.metaarch.notification.notification;

import jakarta.validation.constraints.Size;

public record SendNotificationRequest(Boolean simulateFailure, @Size(max = 500) String failureReason) { }
