package com.metaarch.payment.payment;

import java.math.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import com.metaarch.payment.event.*;
import com.metaarch.payment.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
  private static final DateTimeFormatter REF_DATE = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC);
  private final PaymentRepository payments;
  private final PaymentTransactionRepository transactions;
  private final PaymentEventPublisher events;

  public PaymentService(PaymentRepository payments, PaymentTransactionRepository transactions, PaymentEventPublisher events) {
    this.payments = payments;
    this.transactions = transactions;
    this.events = events;
  }

  @Transactional
  public PaymentResponse initiate(InitiatePaymentRequest request) {
    throw new InvalidPaymentStateException("Payment initiation is disabled until a verified provider adapter and durable initiation workflow are configured.");
  }

  @Transactional(readOnly = true)
  public PaymentResponse get(UUID paymentId) {
    return PaymentResponse.from(find(paymentId));
  }

  @Transactional(readOnly = true)
  public PaymentResponse getByOrder(UUID orderId) {
    return PaymentResponse.from(findByOrder(orderId));
  }

  @Transactional
  public PaymentResponse processDemoPayment(UUID paymentId, ProcessDemoPaymentRequest request) {
    throw new InvalidPaymentStateException("Demo settlement is disabled. Verified payment-provider confirmation is required.");
  }

  @Transactional(readOnly = true)
  public PaymentStatusResponse status(UUID paymentId) {
    return PaymentStatusResponse.from(find(paymentId));
  }

  @Transactional
  public PaymentResponse refundDemoPayment(UUID paymentId, RefundPaymentRequest request) {
    throw new InvalidPaymentStateException("Demo refunds are disabled. Verified payment-provider refund confirmation is required.");
  }

  @Transactional(readOnly = true)
  public List<PaymentTransactionResponse> getTransactions(UUID paymentId) {
    if (!payments.existsById(paymentId)) throw new ResourceNotFoundException("Payment not found: " + paymentId);
    return transactions.findByPaymentIdOrderByCreatedAtDesc(paymentId).stream().map(PaymentTransactionResponse::from).toList();
  }

  @Transactional
  public void createPendingPaymentFromOrder(OrderEvent event) {
    if (event.orderId() == null || event.customerId() == null || event.totalAmount() == null || event.totalAmount().signum() <= 0) throw new IllegalArgumentException("Invalid order payment details");
    var existing = payments.findByOrderId(event.orderId());
    if (existing.isPresent()) {
      if (!existing.get().getCustomerId().equals(event.customerId()) || existing.get().getAmount().compareTo(event.totalAmount()) != 0) {
        throw new InvalidPaymentStateException("Order payment details changed");
      }
      return;
    }
    Payment payment = new Payment(event.orderId(), event.customerId(), nextPaymentReference(), money(event.totalAmount()), "INR", PaymentMethod.DEMO_CARD);
    payment.addTransaction(new PaymentTransaction(nextTransactionReference(), TransactionType.AUTHORIZE, payment.getAmount(), TransactionStatus.PENDING));
    Payment saved = payments.save(payment);
    events.publish(PaymentEventType.PAYMENT_INITIATED, saved);
  }

  @Transactional
  public void refundSuccessfulPaymentForCancelledOrder(UUID orderId) {
    if (payments.findByOrderId(orderId).filter(payment -> payment.getStatus() == PaymentStatus.SUCCESS).isPresent()) {
      throw new InvalidPaymentStateException("Cancellation requires a verified provider refund; automatic demo refunds are disabled.");
    }
  }

  private Payment find(UUID id) {
    return payments.findById(id).orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
  }

  private Payment findByOrder(UUID orderId) {
    return payments.findByOrderId(orderId).orElseThrow(() -> new ResourceNotFoundException("Payment not found for order: " + orderId));
  }

  private BigDecimal money(BigDecimal value) {
    return value.setScale(2, RoundingMode.HALF_UP);
  }

  private String normalizeCurrency(String currency) {
    return currency.trim().toUpperCase(Locale.ROOT);
  }

  private String nextPaymentReference() {
    String reference;
    do {
      reference = "PAY-" + REF_DATE.format(Instant.now()) + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    } while (payments.existsByPaymentReference(reference));
    return reference;
  }

  private String nextTransactionReference() {
    String reference;
    do {
      reference = "TXN-DEMO-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase(Locale.ROOT);
    } while (transactions.existsByTransactionReference(reference));
    return reference;
  }
}
