package com.metaarch.notification.sender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.metaarch.notification.event.OrderEvent;
import com.metaarch.notification.event.OrderEventType;
import com.metaarch.notification.recipient.OrgAccessRecipientClient;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

class StaffOrderEmailServiceTest {
  @Test
  void disabledSendingDoesNotContactRecipientsOrSmtp() {
    OrgAccessRecipientClient recipients = mock(OrgAccessRecipientClient.class);
    JavaMailSender mail = mock(JavaMailSender.class);
    StaffOrderEmailService service = new StaffOrderEmailService(recipients, mail, "from@example.com");
    org.springframework.test.util.ReflectionTestUtils.setField(service, "sendingEnabled", false);
    service.notifyStaff(event());
    verifyNoInteractions(recipients, mail);
  }
  @Test
  void sendsOneMessagePerUniqueRecipientWithOrderDetails() {
    OrgAccessRecipientClient recipients = mock(OrgAccessRecipientClient.class);
    JavaMailSender mail = mock(JavaMailSender.class);
    when(recipients.findRecipients("store-1", "hyderabad"))
      .thenReturn(List.of("manager@example.com", "admin@example.com"));
    StaffOrderEmailService service = new StaffOrderEmailService(recipients, mail, "from@example.com");
    OrderEvent event = event();

    service.notifyStaff(event);

    var captor = org.mockito.ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(mail, times(2)).send(captor.capture());
    assertThat(captor.getAllValues()).allSatisfy(message -> {
      assertThat(message.getSubject()).isEqualTo("New Order Received - " + event.orderId());
      assertThat(message.getText()).contains("store-1", "2", "hyderabad", "39.98");
      assertThat(message.getFrom()).isEqualTo("from@example.com");
    });
  }

  @Test
  void missingLocationDoesNotSendAndSmtpFailureDoesNotEscape() {
    OrgAccessRecipientClient recipients = mock(OrgAccessRecipientClient.class);
    JavaMailSender mail = mock(JavaMailSender.class);
    StaffOrderEmailService service = new StaffOrderEmailService(recipients, mail, "from@example.com");
    OrderEvent event = new OrderEvent(UUID.randomUUID(), OrderEventType.ORDER_CREATED, UUID.randomUUID(), "ORD-1", null, null, "store-1", null, null, BigDecimal.ONE, Instant.now(), 2L, null);

    service.notifyStaff(event);
    verifyNoInteractions(recipients, mail);

    when(recipients.findRecipients("store-1", "hyderabad")).thenReturn(List.of("manager@example.com"));
    doThrow(new RuntimeException("smtp unavailable")).when(mail).send(any(SimpleMailMessage.class));
    service.notifyStaff(event("hyderabad"));
  }

  private OrderEvent event() { return event("hyderabad"); }
  private OrderEvent event(String location) {
    return new OrderEvent(UUID.randomUUID(), OrderEventType.ORDER_CREATED, UUID.randomUUID(), "ORD-1", null, null, "store-1", null, null, new BigDecimal("39.98"), Instant.now(), 2L, location);
  }
}
