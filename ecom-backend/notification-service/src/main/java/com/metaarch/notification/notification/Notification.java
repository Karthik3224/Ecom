package com.metaarch.notification.notification;

import java.time.Instant;
import java.util.UUID;
import com.metaarch.notification.common.AuditedEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "notifications")
public class Notification extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(name = "customer_id", nullable = false) private UUID customerId;
  @Column(name = "order_id") private UUID orderId;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "notification_type", nullable = false, length = 40) private NotificationType notificationType;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 20) private NotificationChannel channel;
  @Column(length = 255) private String recipient;
  @Column(nullable = false, length = 255) private String subject;
  @Column(nullable = false, columnDefinition = "TEXT") private String message;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 20) private NotificationStatus status;
  @Column(name = "source_event_id", unique = true) private UUID sourceEventId;
  @Column(name = "failure_reason", length = 500) private String failureReason;
  @Column(name = "sent_at") private Instant sentAt;

  protected Notification() { }

  public Notification(UUID customerId, UUID orderId, NotificationType notificationType, NotificationChannel channel, String recipient, String subject, String message, UUID sourceEventId) {
    this.customerId = customerId;
    this.orderId = orderId;
    this.notificationType = notificationType;
    this.channel = channel;
    this.recipient = recipient;
    this.subject = subject;
    this.message = message;
    this.sourceEventId = sourceEventId;
    this.status = NotificationStatus.PENDING;
  }

  public UUID getId() { return id; }
  public UUID getCustomerId() { return customerId; }
  public UUID getOrderId() { return orderId; }
  public NotificationType getNotificationType() { return notificationType; }
  public NotificationChannel getChannel() { return channel; }
  public String getRecipient() { return recipient; }
  public String getSubject() { return subject; }
  public String getMessage() { return message; }
  public NotificationStatus getStatus() { return status; }
  public UUID getSourceEventId() { return sourceEventId; }
  public String getFailureReason() { return failureReason; }
  public Instant getSentAt() { return sentAt; }
  public void markSent(Instant sentAt) { this.status = NotificationStatus.SENT; this.sentAt = sentAt; this.failureReason = null; }
  public void markFailed(String failureReason) { this.status = NotificationStatus.FAILED; this.failureReason = failureReason; }
  public void cancel() { this.status = NotificationStatus.CANCELLED; }
}
