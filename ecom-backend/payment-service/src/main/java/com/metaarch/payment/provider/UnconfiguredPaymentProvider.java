package com.metaarch.payment.provider;

import com.metaarch.payment.exception.InvalidPaymentStateException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UnconfiguredPaymentProvider {
  @Bean
  @ConditionalOnMissingBean(PaymentProvider.class)
  public PaymentProvider unavailablePaymentProvider() {
    return new PaymentProvider() {
      private InvalidPaymentStateException unavailable() {
        return new InvalidPaymentStateException("No verified payment provider is configured.");
      }
      public Initiation initiate(PaymentRequest request) { throw unavailable(); }
      public Confirmation verify(String providerPaymentId) { throw unavailable(); }
      public RefundConfirmation refund(RefundRequest request) { throw unavailable(); }
      public VerifiedWebhook verifyWebhook(byte[] rawBody, String signature) { throw unavailable(); }
    };
  }
}
