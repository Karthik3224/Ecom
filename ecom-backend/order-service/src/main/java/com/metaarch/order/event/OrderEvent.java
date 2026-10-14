package com.metaarch.order.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import com.metaarch.order.order.OrderStatus;
import com.metaarch.order.order.PaymentStatus;

public record OrderEvent(
  UUID eventId,
  OrderEventType eventType,
  UUID orderId,
  String orderNumber,
  UUID customerId,
  UUID cartId,
  String storeId,
  UUID shippingAddressId,
  String fulfillmentType,
  OrderStatus status,
  PaymentStatus paymentStatus,
  BigDecimal totalAmount,
  Instant occurredAt,
  String locationId
) { }
