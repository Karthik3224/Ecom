CREATE TABLE notifications (
  id BINARY(16) NOT NULL PRIMARY KEY,
  customer_id BINARY(16) NOT NULL,
  order_id BINARY(16),
  notification_type VARCHAR(40) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  source_event_id BINARY(16),
  failure_reason VARCHAR(500),
  sent_at TIMESTAMP(6),
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_notifications_source_event UNIQUE (source_event_id),
  INDEX idx_notifications_customer_created (customer_id, created_at),
  INDEX idx_notifications_order_created (order_id, created_at),
  INDEX idx_notifications_type (notification_type),
  INDEX idx_notifications_channel (channel),
  INDEX idx_notifications_status_created (status, created_at)
);

CREATE TABLE notification_templates (
  id BINARY(16) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  notification_type VARCHAR(40) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  subject_template VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_notification_templates_name UNIQUE (name),
  INDEX idx_notification_templates_type_channel_status (notification_type, channel, status)
);
