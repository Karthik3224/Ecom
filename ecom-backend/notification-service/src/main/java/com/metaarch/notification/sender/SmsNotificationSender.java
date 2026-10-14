package com.metaarch.notification.sender;

import com.metaarch.notification.notification.*;
import org.slf4j.*;
import org.springframework.stereotype.Component;

@Component
public class SmsNotificationSender implements NotificationSender {
  private static final Logger log = LoggerFactory.getLogger(SmsNotificationSender.class);
  public NotificationChannel channel() { return NotificationChannel.SMS; }
  public void send(Notification notification) {
    log.info("[DEMO SMS] customerId={}, orderId={}, recipient={}, message={}", notification.getCustomerId(), notification.getOrderId(), notification.getRecipient(), notification.getMessage());
  }
}
