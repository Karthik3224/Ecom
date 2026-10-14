package com.metaarch.notification.template;

import java.util.UUID;
import com.metaarch.notification.common.AuditedEntity;
import com.metaarch.notification.notification.*;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "notification_templates")
public class NotificationTemplate extends AuditedEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(nullable = false, unique = true, length = 120) private String name;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(name = "notification_type", nullable = false, length = 40) private NotificationType notificationType;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 20) private NotificationChannel channel;
  @Column(name = "subject_template", nullable = false, length = 255) private String subjectTemplate;
  @Column(name = "message_template", nullable = false, columnDefinition = "TEXT") private String messageTemplate;
  @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 20) private TemplateStatus status;

  protected NotificationTemplate() { }

  public NotificationTemplate(String name, NotificationType notificationType, NotificationChannel channel, String subjectTemplate, String messageTemplate, TemplateStatus status) {
    this.name = name;
    this.notificationType = notificationType;
    this.channel = channel;
    this.subjectTemplate = subjectTemplate;
    this.messageTemplate = messageTemplate;
    this.status = status;
  }

  public UUID getId() { return id; }
  public String getName() { return name; }
  public NotificationType getNotificationType() { return notificationType; }
  public NotificationChannel getChannel() { return channel; }
  public String getSubjectTemplate() { return subjectTemplate; }
  public String getMessageTemplate() { return messageTemplate; }
  public TemplateStatus getStatus() { return status; }
  public void update(String name, NotificationType notificationType, NotificationChannel channel, String subjectTemplate, String messageTemplate, TemplateStatus status) {
    this.name = name;
    this.notificationType = notificationType;
    this.channel = channel;
    this.subjectTemplate = subjectTemplate;
    this.messageTemplate = messageTemplate;
    this.status = status;
  }
}
