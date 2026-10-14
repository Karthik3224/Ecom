package com.metaarch.payment.payment;

import com.metaarch.sync.PublicApiSecurity;
import java.util.UUID;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component("paymentAccess")
@Import(PublicApiSecurity.class)
public class PaymentAccess {
  private final PaymentRepository payments;
  public PaymentAccess(PaymentRepository payments) { this.payments = payments; }
  public boolean owner(UUID id) { return PublicApiSecurity.administrator() || payments.findById(id).map(p -> PublicApiSecurity.owns(p.getCustomerId())).orElse(false); }
  public boolean order(UUID id) { return PublicApiSecurity.administrator() || payments.findByOrderId(id).map(p -> PublicApiSecurity.owns(p.getCustomerId())).orElse(false); }
}
