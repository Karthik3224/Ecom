package com.metaarch.notification.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentEvent(
  UUID eventId,
  PaymentEventType eventType,
  UUID paymentId,
  UUID orderId,
  UUID customerId,
  String paymentReference,
  BigDecimal amount,
  String currency,
  String status,
  Instant occurredAt
) { }
