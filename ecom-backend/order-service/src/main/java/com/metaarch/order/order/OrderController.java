package com.metaarch.order.order;

import java.net.URI;
import java.util.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
  private final OrderService service;
  private final OrderCreation creation;
  private final OrderReviewService reviews;
  public OrderController(OrderService service, OrderCreation creation, OrderReviewService reviews) { this.service = service; this.creation = creation; this.reviews = reviews; }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.create(#request.customerId())")
  @PostMapping public ResponseEntity<OrderResponse> create(@RequestHeader(value="Idempotency-Key", required=false) String key, @Valid @RequestBody CreateOrderRequest request) { OrderResponse order = creation.create(key, request); return ResponseEntity.created(URI.create("/api/v1/orders/" + order.id())).body(order); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.store(#storeId)")
  @GetMapping public List<OrderResponse> list(@RequestParam(required = false) String storeId) { return service.list(storeId); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.read(#orderId)")
  @GetMapping("/{orderId}") public OrderResponse get(@PathVariable UUID orderId) { return service.get(orderId); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.customer(#customerId)")
  @GetMapping("/customer/{customerId}") public List<OrderResponse> getByCustomer(@PathVariable UUID customerId) { return service.getByCustomer(customerId); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.manage(#orderId)")
  @PatchMapping("/{orderId}/status") public OrderResponse updateStatus(@PathVariable UUID orderId, @Valid @RequestBody UpdateOrderStatusRequest request) { return service.updateStatus(orderId, request); }
  @org.springframework.security.access.prepost.PreAuthorize("false")
  @PatchMapping("/{orderId}/payment-status") public OrderResponse updatePaymentStatus(@PathVariable UUID orderId, @Valid @RequestBody UpdateOrderPaymentStatusRequest request) { return service.updatePaymentStatus(orderId, request.normalizedPaymentStatus()); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.owner(#orderId)")
  @PostMapping("/{orderId}/cancel") public OrderResponse cancel(@PathVariable UUID orderId) { return service.cancel(orderId); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.owner(#orderId)")
  @GetMapping("/{orderId}/items") public List<OrderItemResponse> getItems(@PathVariable UUID orderId) { return service.getItems(orderId); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.owner(#orderId)")
  @GetMapping("/{orderId}/review") public ResponseEntity<OrderReviewResponse> getReview(@PathVariable UUID orderId) { return reviews.get(orderId).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build()); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.owner(#orderId)")
  @PostMapping("/{orderId}/review") public OrderReviewResponse saveReview(@PathVariable UUID orderId, @Valid @RequestBody OrderReviewRequest request) { return reviews.save(orderId,request); }
  @org.springframework.security.access.prepost.PreAuthorize("@orderAccess.customer(#customerId)")
  @GetMapping("/customer/{customerId}/history") public List<OrderHistoryResponse> getHistory(@PathVariable UUID customerId) { return service.getHistory(customerId); }
}
