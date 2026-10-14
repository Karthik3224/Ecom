package com.metaarch.notification.template;

import java.net.URI;
import java.util.UUID;
import jakarta.validation.Valid;
import com.metaarch.notification.common.PageResponse;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notification-templates")
public class NotificationTemplateController {
  private final NotificationTemplateService service;
  public NotificationTemplateController(NotificationTemplateService service) { this.service = service; }

  @PostMapping public ResponseEntity<NotificationTemplateResponse> create(@Valid @RequestBody NotificationTemplateRequest request) { NotificationTemplateResponse template = service.create(request); return ResponseEntity.created(URI.create("/api/v1/notification-templates/" + template.id())).body(template); }
  @PutMapping("/{templateId}") public NotificationTemplateResponse update(@PathVariable UUID templateId, @Valid @RequestBody NotificationTemplateRequest request) { return service.update(templateId, request); }
  @GetMapping("/{templateId}") public NotificationTemplateResponse get(@PathVariable UUID templateId) { return service.get(templateId); }
  @GetMapping public PageResponse<NotificationTemplateResponse> list(@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) { return service.list(pageable); }
}
