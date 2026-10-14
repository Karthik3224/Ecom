package com.metaarch.fulfillment.shipment;

import java.time.Instant;
import java.util.*;
import com.metaarch.fulfillment.event.*;
import com.metaarch.fulfillment.exception.*;
import com.metaarch.fulfillment.fulfillment.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShipmentService {
  private final ShipmentRepository shipments;
  private final FulfillmentService fulfillments;
  private final FulfillmentEventPublisher events;

  public ShipmentService(ShipmentRepository shipments, FulfillmentService fulfillments, FulfillmentEventPublisher events) {
    this.shipments = shipments;
    this.fulfillments = fulfillments;
    this.events = events;
  }
  @Transactional(readOnly=true)
  public List<ShipmentResponse> assigned(String partnerId) {
    return shipments.findAllByDeliveryPartnerId(partnerId).stream().map(ShipmentResponse::from).toList();
  }

  @Transactional
  public ShipmentResponse create(CreateShipmentRequest request) {
    Fulfillment fulfillment = fulfillments.findForUpdate(request.fulfillmentId());
    String requested = request.trackingNumber() == null || request.trackingNumber().isBlank() ? null : request.trackingNumber().trim();
    var existing = shipments.findByOrderId(fulfillment.getOrderId());
    if (existing.isPresent()) {
      var saved = existing.get();
      if (!saved.getFulfillmentId().equals(request.fulfillmentId()) || !saved.getCarrier().equals(request.carrier().trim())
          || !saved.getEstimatedDeliveryDate().equals(request.estimatedDeliveryDate())
          || (requested != null && !requested.equals(saved.getTrackingNumber()))) throw new ConflictException("Shipment already exists with different details");
      return ShipmentResponse.from(saved);
    }
    String tracking = requested == null ? UUID.randomUUID().toString() : requested;
    if (shipments.existsByTrackingNumber(tracking)) throw new ConflictException("Shipment already exists for tracking number: " + tracking);
    if (fulfillment.getStatus() != FulfillmentStatus.READY_TO_SHIP) throw new InvalidFulfillmentStateException("Shipment can be created only when fulfillment is READY_TO_SHIP");
    Shipment saved = shipments.save(new Shipment(fulfillment, request.carrier().trim(), tracking, request.estimatedDeliveryDate()));
    events.publish(FulfillmentEventType.SHIPMENT_CREATED, fulfillment, saved, null);
    return ShipmentResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public ShipmentResponse getByOrder(UUID orderId) {
    return ShipmentResponse.from(findByOrder(orderId));
  }

  @Transactional
  public ShipmentResponse updateStatus(UUID shipmentId, UpdateShipmentStatusRequest request) {
    Shipment shipment = find(shipmentId);
    transition(shipment, request.status());
    Fulfillment fulfillment = shipment.getFulfillment();
    if (shipment.getStatus() == ShipmentStatus.IN_TRANSIT) fulfillments.markShipped(fulfillment.getId());
    if (shipment.getStatus() == ShipmentStatus.DELIVERED) fulfillments.markDelivered(fulfillment.getId());
    events.publish(shipment.getStatus() == ShipmentStatus.DELIVERED ? FulfillmentEventType.SHIPMENT_DELIVERED : FulfillmentEventType.SHIPMENT_STATUS_UPDATED, fulfillment, shipment, null);
    return ShipmentResponse.from(shipment);
  }

  @Transactional
  public ShipmentResponse assignDeliveryPartner(UUID shipmentId, AssignDeliveryPartnerRequest request) {
    Shipment shipment = find(shipmentId);
    if (EnumSet.of(ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED, ShipmentStatus.RETURNED).contains(shipment.getStatus())) {
      throw new InvalidFulfillmentStateException("Finalized shipments cannot be assigned to a delivery partner");
    }
    // A FAILED delivery attempt can be retried: reassigning a partner reopens the shipment for a fresh delivery run.
    if (shipment.getStatus() == ShipmentStatus.FAILED) transition(shipment, ShipmentStatus.CREATED);
    shipment.assignDeliveryPartner(
      request.deliveryPartnerId().trim(),
      request.deliveryPartnerName().trim(),
      request.deliveryPartnerPhone() == null ? null : request.deliveryPartnerPhone().trim(),
      request.vehicleNumber() == null ? null : request.vehicleNumber().trim()
    );
    events.publish(FulfillmentEventType.SHIPMENT_STATUS_UPDATED, shipment.getFulfillment(), shipment, null);
    return ShipmentResponse.from(shipment);
  }

  @Transactional
  public ShipmentResponse markDelivered(UUID shipmentId) {
    return updateStatus(shipmentId, new UpdateShipmentStatusRequest(ShipmentStatus.DELIVERED));
  }

  public Shipment find(UUID id) {
    return shipments.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + id));
  }
  public Shipment findForUpdate(UUID id) {
    return shipments.findForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));
  }

  private Shipment findByOrder(UUID orderId) {
    return shipments.findByOrderId(orderId).orElseThrow(() -> new ResourceNotFoundException("Shipment not found for order: " + orderId));
  }

  private void transition(Shipment shipment, ShipmentStatus next) {
    ShipmentStatus current = shipment.getStatus();
    if (current == next) return;
    boolean allowed = switch (current) {
      case CREATED -> EnumSet.of(ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED, ShipmentStatus.FAILED).contains(next);
      case IN_TRANSIT -> EnumSet.of(ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED, ShipmentStatus.FAILED).contains(next);
      case OUT_FOR_DELIVERY -> EnumSet.of(ShipmentStatus.DELIVERED, ShipmentStatus.FAILED, ShipmentStatus.RETURNED).contains(next);
      case FAILED -> EnumSet.of(ShipmentStatus.CREATED, ShipmentStatus.RETURNED, ShipmentStatus.CANCELLED).contains(next);
      case DELIVERED, RETURNED, CANCELLED -> false;
    };
    if (!allowed) throw new InvalidFulfillmentStateException("Invalid shipment status transition from " + current + " to " + next);
    shipment.setStatus(next);
    if (next == ShipmentStatus.IN_TRANSIT && shipment.getShippedAt() == null) shipment.setShippedAt(Instant.now());
    if (next == ShipmentStatus.DELIVERED && shipment.getDeliveredAt() == null) shipment.setDeliveredAt(Instant.now());
  }
}
