package com.metaarch.order.order;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1/orders")
public class OrderDeliveryController {
  private final OrderService orders;
  private final FulfillmentDeliveryClient fulfillment;
  public OrderDeliveryController(OrderService orders, FulfillmentDeliveryClient fulfillment) { this.orders = orders;this.fulfillment = fulfillment; }
  @PreAuthorize("@orderAccess.owner(#orderId)")
  @PostMapping("/{orderId}/reconcile-delivery")
  public OrderResponse reconcile(@PathVariable UUID orderId, @RequestHeader("Authorization") String bearer) {
    OrderResponse order = orders.get(orderId);
    if (order.status() == OrderStatus.DELIVERED || order.status() == OrderStatus.CANCELLED) return order;
    fulfillment.verify(orderId, bearer).ifPresent(orders::applyVerifiedShipmentDelivery);
    return orders.get(orderId);
  }
}
