package com.metaarch.alerts.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.metaarch.alerts.dto.TestEmailRequest;
import com.metaarch.alerts.service.EmailSenderService;

import jakarta.validation.Valid;

@RestController
@Validated
@RequestMapping("/api/alerts")
public class AlertsController {
  private final EmailSenderService emailSenderService;

  public AlertsController(EmailSenderService emailSenderService) {
    this.emailSenderService = emailSenderService;
  }

  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> health() {
    return ResponseEntity.ok(Map.of("service", "alerts-service", "status", "UP"));
  }

  @PostMapping("/test-email")
  public ResponseEntity<Map<String, String>> sendTestMail(@Valid @RequestBody TestEmailRequest request) {
    emailSenderService.sendPlainTextMail(request.getEmailTo(), request.getSubject(), request.getMessage());
    return ResponseEntity.ok(Map.of("message", "Email sent successfully"));
  }
}
