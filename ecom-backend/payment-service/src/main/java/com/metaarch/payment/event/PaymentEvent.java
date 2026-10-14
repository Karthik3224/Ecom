package com.metaarch.payment.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import com.metaarch.payment.payment.PaymentStatus;

public record PaymentEvent(
  UUID eventId,
  PaymentEventType eventType,
  UUID paymentId,
  UUID orderId,
  UUID customerId,
  String paymentReference,
  BigDecimal amount,
  String currency,
  PaymentStatus status,
  Instant occurredAt
) { }
