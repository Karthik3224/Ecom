package com.metaarch.orgaccess.identity;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/internal/notification-recipients")
public class NotificationRecipientController {
  private final NotificationRecipientService recipients;

  public NotificationRecipientController(NotificationRecipientService recipients) {
    this.recipients = recipients;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','GLOBAL_ADMIN')")
  public EmailsResponse find(
      @RequestParam(required = false) String storeId,
      @RequestParam(required = false) String locationId,
      Authentication authentication) {
    if (authentication == null || authentication.getAuthorities().stream()
        .noneMatch(authority -> authority.getAuthority().equals("ROLE_SUPER_ADMIN")
            || authority.getAuthority().equals("ROLE_GLOBAL_ADMIN"))) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient authority");
    }
    if (storeId == null || storeId.isBlank() || locationId == null || locationId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "storeId and locationId are required");
    }
    return new EmailsResponse(recipients.findEmails(storeId, locationId));
  }

  public record EmailsResponse(List<String> emails) { }
}
