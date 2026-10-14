package com.metaarch.payment.provider;

import java.math.BigDecimal;
import java.util.UUID;

/** Provider adapters must verify remote evidence, not trust customer-supplied status. */
public interface PaymentProvider {
  Initiation initiate(PaymentRequest request);
  Confirmation verify(String providerPaymentId);
  RefundConfirmation refund(RefundRequest request);
  VerifiedWebhook verifyWebhook(byte[] rawBody, String signature);

  record PaymentRequest(UUID orderId, BigDecimal amount, String currency, String idempotencyKey) {}
  record Initiation(String providerPaymentId, String redirectUrl) {}
  enum Status { PENDING, SUCCEEDED, FAILED }
  record Confirmation(String providerPaymentId, UUID orderId, BigDecimal amount,
                      String currency, Status status, String evidenceId) {}
  record RefundRequest(String providerPaymentId, BigDecimal amount, String currency, String idempotencyKey) {}
  record RefundConfirmation(String providerRefundId, String providerPaymentId,
                            BigDecimal amount, String currency, Status status, String evidenceId) {}
  record VerifiedWebhook(String eventId, String providerPaymentId) {}
}
