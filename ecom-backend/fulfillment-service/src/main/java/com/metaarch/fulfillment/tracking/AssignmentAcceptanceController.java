package com.metaarch.fulfillment.tracking;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
@RestController
@RequestMapping("/api/v1/shipments")
public class AssignmentAcceptanceController {
  private final TrackingService tracking;
  public AssignmentAcceptanceController(TrackingService tracking) { this.tracking=tracking; }
  @PostMapping("/{shipmentId}/start-delivery")
  @PreAuthorize("@fulfillmentAccess.assignedShipment(#shipmentId)")
  public void start(@PathVariable UUID shipmentId, JwtAuthenticationToken auth) {
    tracking.startDelivery(shipmentId,auth.getToken().getClaimAsString("deliveryPartnerId"));
  }
  @PostMapping("/{shipmentId}/accept-assignment")
  @PreAuthorize("@fulfillmentAccess.assignedShipment(#shipmentId)")
  public void accept(@PathVariable UUID shipmentId, JwtAuthenticationToken auth) {
    tracking.acceptAssignment(shipmentId,auth.getToken().getClaimAsString("deliveryPartnerId"));
  }
}
