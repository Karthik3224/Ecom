package com.metaarch.order.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

public record OrderResponse(
  UUID id, UUID customerId, UUID cartId, String storeId,
  Long deliveryZoneId, BigDecimal calculatedDistanceKm, Long routeDistanceMeters, Integer routeDurationSeconds,
  Integer routeDurationMinutes, String matchedZoneLabel, BigDecimal customerLatitude, BigDecimal customerLongitude,
  BigDecimal storeLatitude, BigDecimal storeLongitude, String deliveryMethod, String fulfillmentType, String globalApproval, BigDecimal deliveryCharge,
  Integer estimatedDeliveryMin, Integer estimatedDeliveryMax, BigDecimal freeDeliveryAbove, boolean freeDeliveryApplied,
  LocalDate scheduledDeliveryDate, String scheduledDeliverySlot, String pickupDetails,
  String orderNumber, OrderStatus status, BigDecimal totalAmount, BigDecimal handlingFee, PaymentStatus paymentStatus,
  List<OrderItemResponse> items, List<OrderAddressResponse> addresses, Instant createdAt, Instant updatedAt) {
  static OrderResponse from(Order order) {
    return new OrderResponse(
      order.getId(),
      order.getCustomerId(),
      order.getCartId(),
      order.getStoreId(),
      order.getDeliveryZoneId(),
      order.getCalculatedDistanceKm(),
      order.getRouteDistanceMeters(),
      order.getRouteDurationSeconds(),
      order.getRouteDurationMinutes(),
      order.getMatchedZoneLabel(),
      order.getCustomerLatitude(),
      order.getCustomerLongitude(),
      order.getStoreLatitude(),
      order.getStoreLongitude(),
      order.getDeliveryMethod(),
      order.getFulfillmentType(),
      order.getGlobalApproval(),
      order.getDeliveryCharge(),
      order.getEstimatedDeliveryMin(),
      order.getEstimatedDeliveryMax(),
      order.getFreeDeliveryAbove(),
      order.isFreeDeliveryApplied(),
      order.getScheduledDeliveryDate(),
      order.getScheduledDeliverySlot(),
      order.getPickupDetails(),
      order.getOrderNumber(),
      order.getStatus(),
      order.getTotalAmount(),
      order.getHandlingFee(),
      order.getPaymentStatus(),
      order.getItems().stream().map(OrderItemResponse::from).toList(),
      order.getAddresses().stream().map(OrderAddressResponse::from).toList(),
      order.getCreatedAt(),
      order.getUpdatedAt());
  }
}
