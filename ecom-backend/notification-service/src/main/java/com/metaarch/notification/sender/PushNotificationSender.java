package com.metaarch.notification.sender;

import com.metaarch.notification.notification.*;
import org.slf4j.*;
import org.springframework.stereotype.Component;

@Component
public class PushNotificationSender implements NotificationSender {
  private static final Logger log = LoggerFactory.getLogger(PushNotificationSender.class);
  public NotificationChannel channel() { return NotificationChannel.PUSH; }
  public void send(Notification notification) {
    log.info("[DEMO PUSH] customerId={}, orderId={}, recipient={}, subject={}, message={}", notification.getCustomerId(), notification.getOrderId(), notification.getRecipient(), notification.getSubject(), notification.getMessage());
  }
}
