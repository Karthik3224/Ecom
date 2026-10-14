package com.metaarch.notification.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderEvent(
  UUID eventId,
  OrderEventType eventType,
  UUID orderId,
  String orderNumber,
  UUID customerId,
  UUID cartId,
  String storeId,
  String status,
  String paymentStatus,
  BigDecimal totalAmount,
  Instant occurredAt,
  Long deliveryZoneId,
  String locationId
) { }
