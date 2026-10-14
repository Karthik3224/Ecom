package com.metaarch.payment.provider;

import com.metaarch.payment.event.*;
import com.metaarch.payment.payment.*;
import com.metaarch.payment.exception.InvalidPaymentStateException;
import com.metaarch.sync.SyncAuthentication;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class PaymentConfirmationService {
  private final PaymentProvider provider;
  private final JdbcTemplate jdbc;
  private final PaymentRepository payments;
  private final PaymentEventPublisher events;
  private final TransactionTemplate transactions;
  public PaymentConfirmationService(PaymentProvider provider, JdbcTemplate jdbc, PaymentRepository payments,
                                    PaymentEventPublisher events, PlatformTransactionManager manager) {
    this.provider = provider; this.jdbc = jdbc; this.payments = payments; this.events = events;
    transactions = new TransactionTemplate(manager);
  }

  public void confirm(byte[] rawBody, String signature) {
    // Provider network verification is outside the database transaction.
    var webhook = provider.verifyWebhook(rawBody, signature);
    if (webhook == null || blank(webhook.eventId()) || blank(webhook.providerPaymentId())) reject();
    var confirmation = provider.verify(webhook.providerPaymentId());
    if (confirmation == null || !webhook.providerPaymentId().equals(confirmation.providerPaymentId())
        || blank(confirmation.evidenceId()) || confirmation.orderId() == null || confirmation.amount() == null
        || confirmation.status() == null) reject();
    transactions.executeWithoutResult(tx -> {
      jdbc.queryForObject("SELECT id FROM sync_receiver_lock WHERE id=1 FOR UPDATE", Integer.class);
      var hashes = jdbc.queryForList("SELECT body_hash FROM provider_payment_receipts WHERE event_id=?", String.class, webhook.eventId());
      String hash = SyncAuthentication.digest(rawBody);
      if (!hashes.isEmpty()) {
        if (!hashes.getFirst().equals(hash)) reject();
        return;
      }
      var bindings = jdbc.queryForList("SELECT payment_id FROM provider_payment_bindings WHERE provider_payment_id=?", String.class, webhook.providerPaymentId());
      if (bindings.size() != 1) reject();
      Payment payment = payments.findLockedById(UUID.fromString(bindings.getFirst())).orElseThrow(() -> new InvalidPaymentStateException("Payment not found"));
      if (!payment.getOrderId().equals(confirmation.orderId()) || !payment.getCurrency().equals(confirmation.currency())
          || payment.getAmount().compareTo(confirmation.amount()) != 0) reject();
      PaymentStatus next = switch (confirmation.status()) {
        case PENDING -> PaymentStatus.PENDING;
        case SUCCEEDED -> PaymentStatus.SUCCESS;
        case FAILED -> PaymentStatus.FAILED;
      };
      if (payment.getStatus() != next) {
        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.REFUNDED
            || next == PaymentStatus.PENDING) reject();
        payment.setStatus(next);
        payment.addTransaction(new PaymentTransaction("PROVIDER-" + UUID.randomUUID(), TransactionType.CAPTURE,
          payment.getAmount(), next == PaymentStatus.SUCCESS ? TransactionStatus.SUCCESS : TransactionStatus.FAILED));
        events.publish(next == PaymentStatus.SUCCESS ? PaymentEventType.PAYMENT_SUCCESS : PaymentEventType.PAYMENT_FAILED, payment);
      }
      jdbc.update("INSERT INTO provider_payment_receipts(event_id,provider_payment_id,evidence_id,body_hash) VALUES (?,?,?,?)",
        webhook.eventId(), webhook.providerPaymentId(), confirmation.evidenceId(), hash);
    });
  }
  private boolean blank(String value) { return value == null || value.isBlank() || value.length() > 128; }
  private void reject() { throw new InvalidPaymentStateException("Invalid or unbound provider payment confirmation"); }
}
