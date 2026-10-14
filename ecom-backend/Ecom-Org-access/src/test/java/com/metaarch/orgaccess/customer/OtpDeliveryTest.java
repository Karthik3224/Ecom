package com.metaarch.orgaccess.customer;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OtpDeliveryTest {
  @SuppressWarnings("unchecked")
  private ObjectProvider<JavaMailSender> provider() {
    return mock(ObjectProvider.class);
  }

  @Test void missingMailConfigurationFailsClosed() {
    var delivery = new OtpDelivery(provider(), "", "", "");
    var error = assertThrows(ResponseStatusException.class,
        () -> delivery.send("customer@example.com", "123456", "SIGNUP"));
    assertEquals(503, error.getStatusCode().value());
    assertFalse(error.getReason().contains("123456"));
  }

  @Test void smtpFailureDoesNotReturnADemoCode() {
    var provider = provider();
    var sender = mock(JavaMailSender.class);
    when(provider.getIfAvailable()).thenReturn(sender);
    doThrow(new MailSendException("Unavailable")).when(sender).send(any(SimpleMailMessage.class));
    var delivery = new OtpDelivery(provider, "sender@example.com", "", "");
    assertThrows(ResponseStatusException.class,
        () -> delivery.send("customer@example.com", "123456", "RESET"));
  }

  @Test void unconfiguredSmsFailsClosed() {
    var delivery = new OtpDelivery(provider(), "sender@example.com", "", "");
    assertThrows(ResponseStatusException.class,
        () -> delivery.send("+919876543210", "123456", "MOBILE"));
  }
}
