package com.metaarch.fulfillment.fulfillment;

import java.util.*;
import com.metaarch.fulfillment.event.*;
import com.metaarch.fulfillment.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FulfillmentService {
  private final FulfillmentRepository fulfillments;
  private final FulfillmentEventPublisher events;

  public FulfillmentService(FulfillmentRepository fulfillments, FulfillmentEventPublisher events) {
    this.fulfillments = fulfillments;
    this.events = events;
  }

  @Transactional
  public FulfillmentResponse create(CreateFulfillmentRequest request) {
    Fulfillment saved = createEntity(request);
    return FulfillmentResponse.from(saved);
  }

  @Transactional
  public Fulfillment createEntity(CreateFulfillmentRequest request) {
    fulfillments.findByOrderId(request.orderId()).ifPresent(existing -> {
      throw new ConflictException("Fulfillment already exists for order: " + existing.getOrderId());
    });
    Fulfillment saved = fulfillments.save(new Fulfillment(request.orderId(), request.customerId(), request.storeId().trim(), request.fulfillmentType(), request.shippingAddressId()));
    events.publish(FulfillmentEventType.FULFILLMENT_CREATED, saved, null, null);
    return saved;
  }

  @Transactional(readOnly = true)
  public FulfillmentResponse get(UUID fulfillmentId) {
    return FulfillmentResponse.from(find(fulfillmentId));
  }

  @Transactional(readOnly = true)
  public FulfillmentResponse getByOrder(UUID orderId) {
    return FulfillmentResponse.from(findByOrder(orderId));
  }

  @Transactional
  public FulfillmentResponse updateStatus(UUID fulfillmentId, UpdateFulfillmentStatusRequest request) {
    Fulfillment fulfillment = find(fulfillmentId);
    transition(fulfillment, request.status());
    events.publish(FulfillmentEventType.FULFILLMENT_STATUS_UPDATED, fulfillment, null, null);
    return FulfillmentResponse.from(fulfillment);
  }

  @Transactional
  public void cancelByOrderIfAllowed(UUID orderId) {
    fulfillments.findByOrderId(orderId).ifPresent(fulfillment -> {
      if (EnumSet.of(FulfillmentStatus.PENDING, FulfillmentStatus.ALLOCATED, FulfillmentStatus.PACKING, FulfillmentStatus.READY_TO_SHIP).contains(fulfillment.getStatus())) {
        fulfillment.setStatus(FulfillmentStatus.CANCELLED);
        events.publish(FulfillmentEventType.FULFILLMENT_STATUS_UPDATED, fulfillment, null, null);
      }
    });
  }

  @Transactional
  public void markShipped(UUID fulfillmentId) {
    Fulfillment fulfillment = find(fulfillmentId);
    transition(fulfillment, FulfillmentStatus.SHIPPED);
    events.publish(FulfillmentEventType.FULFILLMENT_STATUS_UPDATED, fulfillment, null, null);
  }

  @Transactional
  public void markDelivered(UUID fulfillmentId) {
    Fulfillment fulfillment = find(fulfillmentId);
    if (fulfillment.getStatus() != FulfillmentStatus.DELIVERED) {
      transition(fulfillment, FulfillmentStatus.DELIVERED);
      events.publish(FulfillmentEventType.FULFILLMENT_STATUS_UPDATED, fulfillment, null, null);
    }
  }

  public Fulfillment find(UUID id) {
    return fulfillments.findById(id).orElseThrow(() -> new ResourceNotFoundException("Fulfillment not found: " + id));
  }
  public Fulfillment findForUpdate(UUID id) {
    return fulfillments.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Fulfillment not found: " + id));
  }

  public Fulfillment findByOrder(UUID orderId) {
    return fulfillments.findByOrderId(orderId).orElseThrow(() -> new ResourceNotFoundException("Fulfillment not found for order: " + orderId));
  }

  private void transition(Fulfillment fulfillment, FulfillmentStatus next) {
    FulfillmentStatus current = fulfillment.getStatus();
    if (current == next) return;
    boolean allowed = switch (current) {
      case PENDING -> EnumSet.of(FulfillmentStatus.ALLOCATED, FulfillmentStatus.CANCELLED, FulfillmentStatus.FAILED).contains(next);
      case ALLOCATED -> EnumSet.of(FulfillmentStatus.PACKING, FulfillmentStatus.CANCELLED, FulfillmentStatus.FAILED).contains(next);
      case PACKING -> EnumSet.of(FulfillmentStatus.READY_TO_SHIP, FulfillmentStatus.CANCELLED, FulfillmentStatus.FAILED).contains(next);
      case READY_TO_SHIP -> EnumSet.of(FulfillmentStatus.SHIPPED, FulfillmentStatus.CANCELLED, FulfillmentStatus.FAILED).contains(next);
      case SHIPPED -> EnumSet.of(FulfillmentStatus.DELIVERED, FulfillmentStatus.FAILED).contains(next);
      case FAILED -> EnumSet.of(FulfillmentStatus.PENDING, FulfillmentStatus.CANCELLED).contains(next);
      case DELIVERED, CANCELLED -> false;
    };
    if (!allowed) throw new InvalidFulfillmentStateException("Invalid fulfillment status transition from " + current + " to " + next);
    fulfillment.setStatus(next);
  }
}
