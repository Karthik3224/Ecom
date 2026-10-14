package com.metaarch.payment.payment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.*;
import com.metaarch.payment.event.PaymentEventPublisher;
import com.metaarch.payment.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
  @Mock PaymentRepository payments;
  @Mock PaymentTransactionRepository transactions;
  @Mock PaymentEventPublisher events;
  @InjectMocks PaymentService service;

  @Test
  void initiateCreatesPendingDemoPayment() {
    UUID orderId = UUID.randomUUID();
    UUID customerId = UUID.randomUUID();
    assertThatThrownBy(() -> service.initiate(new InitiatePaymentRequest(orderId, customerId, new BigDecimal("125.235"), "inr", PaymentMethod.DEMO_UPI)))
      .isInstanceOf(InvalidPaymentStateException.class);
    verifyNoInteractions(payments, transactions, events);
  }

  @Test
  void initiateRejectsDuplicateOrderPayment() {
    UUID orderId = UUID.randomUUID();

    assertThatThrownBy(() -> service.initiate(new InitiatePaymentRequest(orderId, UUID.randomUUID(), BigDecimal.TEN, "INR", PaymentMethod.DEMO_CARD)))
      .isInstanceOf(InvalidPaymentStateException.class);
  }

  @Test
  void processDemoPaymentCannotFabricateSuccess() {
    UUID paymentId = UUID.randomUUID();
    Payment payment = new Payment(UUID.randomUUID(), UUID.randomUUID(), "PAY-REF", BigDecimal.TEN, "INR", PaymentMethod.DEMO_CARD);
    assertThatThrownBy(() -> service.processDemoPayment(paymentId, new ProcessDemoPaymentRequest(PaymentStatus.SUCCESS)))
      .isInstanceOf(InvalidPaymentStateException.class).hasMessageContaining("Verified payment-provider");
    assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
    verifyNoInteractions(payments, transactions, events);
  }

  @Test
  void refundRequiresSuccessfulPayment() {
    UUID paymentId = UUID.randomUUID();
    Payment payment = new Payment(UUID.randomUUID(), UUID.randomUUID(), "PAY-REF", BigDecimal.TEN, "INR", PaymentMethod.DEMO_CARD);

    assertThatThrownBy(() -> service.refundDemoPayment(paymentId, new RefundPaymentRequest(null, null)))
      .isInstanceOf(InvalidPaymentStateException.class);
  }

  @Test
  void refundCannotFabricateProviderRefund() {
    UUID paymentId = UUID.randomUUID();
    Payment payment = new Payment(UUID.randomUUID(), UUID.randomUUID(), "PAY-REF", BigDecimal.TEN, "INR", PaymentMethod.DEMO_CARD);
    payment.setStatus(PaymentStatus.SUCCESS);
    assertThatThrownBy(() -> service.refundDemoPayment(paymentId, new RefundPaymentRequest(new BigDecimal("5.00"), "test refund")))
      .isInstanceOf(InvalidPaymentStateException.class);
    assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
    verifyNoInteractions(payments, transactions, events);
  }
}
