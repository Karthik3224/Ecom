package com.metaarch.fulfillment.fulfillment;

import java.net.URI;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fulfillments")
public class FulfillmentController {
  private final FulfillmentService service;
  public FulfillmentController(FulfillmentService service) { this.service = service; }
  @org.springframework.security.access.prepost.PreAuthorize("@fulfillmentAccess.create(#request)")
  @PostMapping public ResponseEntity<FulfillmentResponse> create(@Valid @RequestBody CreateFulfillmentRequest request) { FulfillmentResponse fulfillment = service.create(request); return ResponseEntity.created(URI.create("/api/v1/fulfillments/" + fulfillment.id())).body(fulfillment); }
  @org.springframework.security.access.prepost.PreAuthorize("@fulfillmentAccess.owner(#fulfillmentId)")
  @GetMapping("/{fulfillmentId}") public FulfillmentResponse get(@PathVariable UUID fulfillmentId) { return service.get(fulfillmentId); }
  @org.springframework.security.access.prepost.PreAuthorize("@fulfillmentAccess.order(#orderId)")
  @GetMapping("/order/{orderId}") public FulfillmentResponse getByOrder(@PathVariable UUID orderId) { return service.getByOrder(orderId); }
  @org.springframework.security.access.prepost.PreAuthorize("@fulfillmentAccess.manage(#fulfillmentId)")
  @PatchMapping("/{fulfillmentId}/status") public FulfillmentResponse updateStatus(@PathVariable UUID fulfillmentId, @Valid @RequestBody UpdateFulfillmentStatusRequest request) { return service.updateStatus(fulfillmentId, request); }
}
