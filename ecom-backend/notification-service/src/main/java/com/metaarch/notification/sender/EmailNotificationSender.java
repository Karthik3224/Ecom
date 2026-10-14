package com.metaarch.notification.sender;

import com.metaarch.notification.notification.*;
import org.slf4j.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationSender implements NotificationSender {
  private static final Logger log = LoggerFactory.getLogger(EmailNotificationSender.class);
  private final JavaMailSender mailSender;
  private final String from;
  public EmailNotificationSender(JavaMailSender mailSender, @Value("${SMTP_FROM:${MAIL_FROM:}}") String from) { this.mailSender = mailSender; this.from = from == null ? "" : from.trim(); }
  public NotificationChannel channel() { return NotificationChannel.EMAIL; }
  public void send(Notification notification) {
    if (notification.getRecipient() == null || notification.getRecipient().isBlank()) {
      log.warn("Email notification has no recipient. orderId={}", notification.getOrderId());
      return;
    }
    SimpleMailMessage message = new SimpleMailMessage();
    if (!from.isBlank()) message.setFrom(from);
    message.setTo(notification.getRecipient());
    message.setSubject(notification.getSubject());
    message.setText(notification.getMessage());
    mailSender.send(message);
  }
}
