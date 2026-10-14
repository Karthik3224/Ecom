package com.metaarch.notification.notification;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.metaarch.notification.common.PageResponse;
import com.metaarch.notification.exception.*;
import com.metaarch.notification.sender.NotificationSender;
import com.metaarch.notification.template.*;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
  private static final String CHANNEL_TAG = "channel";
  private static final String NOTIFICATIONS_FAILED = "notifications.failed";

  private final NotificationRepository repository;
  private final NotificationTemplateService templateService;
  private final TemplateRenderer renderer;
  private final Map<NotificationChannel, NotificationSender> senders;
  private final boolean sendingEnabled;
  private final MeterRegistry meterRegistry;

  public NotificationService(
    NotificationRepository repository,
    NotificationTemplateService templateService,
    TemplateRenderer renderer,
    List<NotificationSender> senders,
    @Value("${notification.sending.enabled:true}") boolean sendingEnabled,
    MeterRegistry meterRegistry) {
    this.repository = repository;
    this.templateService = templateService;
    this.renderer = renderer;
    this.senders = senders.stream().collect(Collectors.toMap(NotificationSender::channel, Function.identity()));
    this.sendingEnabled = sendingEnabled;
    this.meterRegistry = meterRegistry;
  }

  @Transactional
  public NotificationResponse create(CreateNotificationRequest request) {
    Notification notification = new Notification(request.customerId(), request.orderId(), request.notificationType(), request.channel(), request.recipient(), request.subject(), request.message(), null);
    Notification saved = repository.save(notification);
    meterRegistry.counter("notifications.created", "type", saved.getNotificationType().name(), CHANNEL_TAG, saved.getChannel().name()).increment();
    return NotificationResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public NotificationResponse get(UUID id) {
    return NotificationResponse.from(find(id));
  }

  @Transactional(readOnly = true)
  public PageResponse<NotificationResponse> getByCustomer(UUID customerId, Pageable pageable) {
    return PageResponse.from(repository.findByCustomerId(customerId, pageable).map(NotificationResponse::from));
  }

  @Transactional(readOnly = true)
  public PageResponse<NotificationResponse> getByOrder(UUID orderId, Pageable pageable) {
    return PageResponse.from(repository.findByOrderId(orderId, pageable).map(NotificationResponse::from));
  }

  @Transactional(readOnly = true)
  public PageResponse<NotificationResponse> history(Pageable pageable) {
    return PageResponse.from(repository.findAll(pageable).map(NotificationResponse::from));
  }

  @Transactional
  public NotificationResponse updateStatus(UUID id, UpdateNotificationStatusRequest request) {
    Notification notification = find(id);
    if (notification.getStatus() != NotificationStatus.PENDING) {
      throw new InvalidNotificationStateException("Only PENDING notifications can change status");
    }
    if (request.status() == NotificationStatus.SENT) {
      notification.markSent(Instant.now());
      meterRegistry.counter("notifications.sent", CHANNEL_TAG, notification.getChannel().name()).increment();
    } else if (request.status() == NotificationStatus.FAILED) {
      notification.markFailed("Status updated manually");
      meterRegistry.counter(NOTIFICATIONS_FAILED, CHANNEL_TAG, notification.getChannel().name()).increment();
    } else if (request.status() == NotificationStatus.CANCELLED) {
      notification.cancel();
      meterRegistry.counter("notifications.cancelled", CHANNEL_TAG, notification.getChannel().name()).increment();
    } else {
      throw new InvalidNotificationStateException("Unsupported notification status transition: " + request.status());
    }
    return NotificationResponse.from(notification);
  }

  @Transactional
  public NotificationResponse send(UUID id, SendNotificationRequest request) {
    Notification notification = find(id);
    sendExisting(notification, Boolean.TRUE.equals(request == null ? null : request.simulateFailure()), request == null ? null : request.failureReason());
    return NotificationResponse.from(notification);
  }

  @Transactional
  public NotificationResponse createFromEvent(UUID sourceEventId, NotificationType type, NotificationChannel channel, UUID customerId, UUID orderId, String recipient, Map<String, ?> templateValues) {
    if (sourceEventId != null) {
      Optional<Notification> existing = repository.findBySourceEventId(sourceEventId);
      if (existing.isPresent()) return NotificationResponse.from(existing.get());
    }
    RenderedTemplate rendered = render(type, channel, templateValues);
    Notification notification = new Notification(customerId, orderId, type, channel, recipient, rendered.subject(), rendered.message(), sourceEventId);
    Notification saved = repository.save(notification);
    meterRegistry.counter("notifications.created", "type", saved.getNotificationType().name(), CHANNEL_TAG, saved.getChannel().name()).increment();
    sendExisting(saved, false, null);
    return NotificationResponse.from(saved);
  }

  private void sendExisting(Notification notification, boolean simulateFailure, String failureReason) {
    if (notification.getStatus() != NotificationStatus.PENDING) {
      throw new InvalidNotificationStateException("Only PENDING notifications can be sent");
    }
    if (simulateFailure) {
      notification.markFailed(failureReason == null || failureReason.isBlank() ? "Simulated notification failure" : failureReason);
      meterRegistry.counter(NOTIFICATIONS_FAILED, CHANNEL_TAG, notification.getChannel().name()).increment();
      return;
    }
    if (!sendingEnabled) {
      return;
    }
    NotificationSender sender = senders.get(notification.getChannel());
    if (sender == null) {
      throw new InvalidNotificationStateException("No sender configured for channel " + notification.getChannel());
    }
    try {
      sender.send(notification);
      notification.markSent(Instant.now());
      meterRegistry.counter("notifications.sent", CHANNEL_TAG, notification.getChannel().name()).increment();
    } catch (RuntimeException ex) {
      notification.markFailed(ex.getMessage());
      meterRegistry.counter(NOTIFICATIONS_FAILED, CHANNEL_TAG, notification.getChannel().name()).increment();
    }
  }

  private RenderedTemplate render(NotificationType type, NotificationChannel channel, Map<String, ?> values) {
    return templateService.findActive(type, channel)
      .map(template -> new RenderedTemplate(renderer.render(template.getSubjectTemplate(), values), renderer.render(template.getMessageTemplate(), values)))
      .orElseGet(() -> fallbackTemplate(type, values));
  }

  private RenderedTemplate fallbackTemplate(NotificationType type, Map<String, ?> values) {
    String orderId = Objects.toString(values.get("orderId"), "");
    String subject = "E-commerce update: " + type;
    String message = "Notification " + type + " received" + (orderId.isBlank() ? "." : " for order " + orderId + ".");
    return new RenderedTemplate(subject, message);
  }

  private Notification find(UUID id) {
    return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
  }

  private record RenderedTemplate(String subject, String message) { }
}
