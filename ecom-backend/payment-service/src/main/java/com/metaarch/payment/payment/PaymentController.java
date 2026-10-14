package com.metaarch.payment.payment;

import java.net.URI;
import java.util.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
  private final PaymentService service;
  public PaymentController(PaymentService service) { this.service = service; }
  @GetMapping("/capabilities") public Map<String, Object> capabilities() {
    return Map.of("processingEnabled", false, "reason", "Payments are unavailable until a verified provider is configured.");
  }

  @org.springframework.security.access.prepost.PreAuthorize("false")
  @PostMapping public ResponseEntity<PaymentResponse> initiate(@Valid @RequestBody InitiatePaymentRequest request) { PaymentResponse payment = service.initiate(request); return ResponseEntity.created(URI.create("/api/v1/payments/" + payment.id())).body(payment); }
  @org.springframework.security.access.prepost.PreAuthorize("@paymentAccess.owner(#paymentId)")
  @GetMapping("/{paymentId}") public PaymentResponse get(@PathVariable UUID paymentId) { return service.get(paymentId); }
  @org.springframework.security.access.prepost.PreAuthorize("@paymentAccess.order(#orderId)")
  @GetMapping("/order/{orderId}") public PaymentResponse getByOrder(@PathVariable UUID orderId) { return service.getByOrder(orderId); }
  @org.springframework.security.access.prepost.PreAuthorize("false")
  @PostMapping("/{paymentId}/process-demo") public PaymentResponse processDemoPayment(@PathVariable UUID paymentId, @Valid @RequestBody ProcessDemoPaymentRequest request) { return service.processDemoPayment(paymentId, request); }
  @org.springframework.security.access.prepost.PreAuthorize("@paymentAccess.owner(#paymentId)")
  @GetMapping("/{paymentId}/status") public PaymentStatusResponse status(@PathVariable UUID paymentId) { return service.status(paymentId); }
  @org.springframework.security.access.prepost.PreAuthorize("false")
  @PostMapping("/{paymentId}/refund-demo") public PaymentResponse refundDemoPayment(@PathVariable UUID paymentId, @Valid @RequestBody(required = false) RefundPaymentRequest request) { return service.refundDemoPayment(paymentId, request); }
  @org.springframework.security.access.prepost.PreAuthorize("@paymentAccess.owner(#paymentId)")
  @GetMapping("/{paymentId}/transactions") public List<PaymentTransactionResponse> transactions(@PathVariable UUID paymentId) { return service.getTransactions(paymentId); }
}
