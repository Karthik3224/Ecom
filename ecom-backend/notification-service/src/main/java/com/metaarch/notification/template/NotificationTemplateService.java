package com.metaarch.notification.template;

import java.util.*;
import com.metaarch.notification.common.PageResponse;
import com.metaarch.notification.exception.*;
import com.metaarch.notification.notification.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationTemplateService {
  private final NotificationTemplateRepository repository;

  public NotificationTemplateService(NotificationTemplateRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public NotificationTemplateResponse create(NotificationTemplateRequest request) {
    ensureSingleActiveTemplate(request.notificationType(), request.channel(), request.status(), null);
    NotificationTemplate template = new NotificationTemplate(request.name(), request.notificationType(), request.channel(), request.subjectTemplate(), request.messageTemplate(), request.status());
    return NotificationTemplateResponse.from(repository.save(template));
  }

  @Transactional
  public NotificationTemplateResponse update(UUID id, NotificationTemplateRequest request) {
    NotificationTemplate template = find(id);
    ensureSingleActiveTemplate(request.notificationType(), request.channel(), request.status(), id);
    template.update(request.name(), request.notificationType(), request.channel(), request.subjectTemplate(), request.messageTemplate(), request.status());
    return NotificationTemplateResponse.from(template);
  }

  @Transactional(readOnly = true)
  public NotificationTemplateResponse get(UUID id) {
    return NotificationTemplateResponse.from(find(id));
  }

  @Transactional(readOnly = true)
  public PageResponse<NotificationTemplateResponse> list(Pageable pageable) {
    return PageResponse.from(repository.findAll(pageable).map(NotificationTemplateResponse::from));
  }

  @Transactional(readOnly = true)
  public Optional<NotificationTemplate> findActive(NotificationType notificationType, NotificationChannel channel) {
    return repository.findByNotificationTypeAndChannelAndStatus(notificationType, channel, TemplateStatus.ACTIVE);
  }

  private NotificationTemplate find(UUID id) {
    return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification template not found: " + id));
  }

  private void ensureSingleActiveTemplate(NotificationType notificationType, NotificationChannel channel, TemplateStatus status, UUID existingId) {
    if (status != TemplateStatus.ACTIVE) return;
    boolean exists = existingId == null
      ? repository.existsByNotificationTypeAndChannelAndStatus(notificationType, channel, TemplateStatus.ACTIVE)
      : repository.existsByNotificationTypeAndChannelAndStatusAndIdNot(notificationType, channel, TemplateStatus.ACTIVE, existingId);
    if (exists) {
      throw new ConflictException("An active template already exists for " + notificationType + " and " + channel);
    }
  }
}
