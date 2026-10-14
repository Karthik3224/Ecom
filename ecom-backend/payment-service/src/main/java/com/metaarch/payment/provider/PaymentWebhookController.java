package com.metaarch.payment.provider;

import org.springframework.web.bind.annotation.*;

@RestController
public class PaymentWebhookController {
  private final PaymentConfirmationService confirmations;
  public PaymentWebhookController(PaymentConfirmationService confirmations) { this.confirmations = confirmations; }
  @PostMapping(value="/internal/provider/payment-webhook", consumes="application/json")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void confirm(@RequestBody byte[] body, @RequestHeader("X-Provider-Signature") String signature) {
    if (body.length > 262144) throw new IllegalArgumentException("Webhook too large");
    confirmations.confirm(body, signature);
  }
}
