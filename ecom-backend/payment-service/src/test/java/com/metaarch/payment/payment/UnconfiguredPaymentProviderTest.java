package com.metaarch.payment.payment;

import com.metaarch.payment.exception.InvalidPaymentStateException;
import com.metaarch.payment.provider.UnconfiguredPaymentProvider;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UnconfiguredPaymentProviderTest {
  @Test
  void everyOperationFailsClosedWithoutProviderConfiguration() {
    var provider = new UnconfiguredPaymentProvider().unavailablePaymentProvider();
    assertThatThrownBy(() -> provider.initiate(null)).isInstanceOf(InvalidPaymentStateException.class);
    assertThatThrownBy(() -> provider.verify("payment")).isInstanceOf(InvalidPaymentStateException.class);
    assertThatThrownBy(() -> provider.refund(null)).isInstanceOf(InvalidPaymentStateException.class);
    assertThatThrownBy(() -> provider.verifyWebhook(new byte[0], "signature"))
      .isInstanceOf(InvalidPaymentStateException.class);
  }
}
