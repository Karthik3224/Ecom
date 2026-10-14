package com.metaarch.notification.sender;

import com.metaarch.notification.event.OrderEvent;
import com.metaarch.notification.recipient.OrgAccessRecipientClient;
import com.metaarch.notification.template.StaffOrderEmailTemplate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class StaffOrderEmailService {
  private static final Logger log = LoggerFactory.getLogger(StaffOrderEmailService.class);
  private final OrgAccessRecipientClient recipients;
  private final JavaMailSender mailSender;
  private final String from;
  @Value("${notification.sending.enabled:true}")
  private boolean sendingEnabled = true;

  public StaffOrderEmailService(OrgAccessRecipientClient recipients, JavaMailSender mailSender,
      @Value("${SMTP_FROM:${MAIL_FROM:}}") String from) {
    this.recipients = recipients;
    this.mailSender = mailSender;
    this.from = from == null ? "" : from.trim();
  }

  public void notifyStaff(OrderEvent event) {
    if (!sendingEnabled) return;
    if (event.storeId() == null || event.storeId().isBlank() || event.locationId() == null || event.locationId().isBlank()) {
      log.warn("Skipping staff notification because storeId or locationId is missing. orderId={}", event.orderId());
      return;
    }
    List<String> emails = recipients.findRecipients(event.storeId(), event.locationId());
    if (emails.isEmpty()) {
      log.warn("No valid staff recipients found for orderId={}", event.orderId());
      return;
    }
    for (String email : emails) {
      try {
        SimpleMailMessage message = new SimpleMailMessage();
        if (!from.isBlank()) message.setFrom(from);
        message.setTo(email);
        message.setSubject(StaffOrderEmailTemplate.subject(event));
        message.setText(StaffOrderEmailTemplate.body(event));
        mailSender.send(message);
      } catch (RuntimeException ex) {
        log.error("Staff order email failed. orderId={}, recipient={}", event.orderId(), email, ex);
      }
    }
  }
}
