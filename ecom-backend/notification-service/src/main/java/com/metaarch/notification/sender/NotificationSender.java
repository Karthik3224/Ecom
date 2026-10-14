package com.metaarch.notification.sender;

import com.metaarch.notification.notification.*;

public interface NotificationSender {
  NotificationChannel channel();
  void send(Notification notification);
}
