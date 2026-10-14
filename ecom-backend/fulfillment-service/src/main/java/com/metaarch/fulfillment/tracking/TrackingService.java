package com.metaarch.fulfillment.tracking;

import java.util.*;
import com.metaarch.fulfillment.event.*;
import com.metaarch.fulfillment.shipment.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrackingService {
  private final TrackingEventRepository eventsRepository;
  private final ShipmentService shipments;
  private final FulfillmentEventPublisher events;

  public TrackingService(TrackingEventRepository eventsRepository, ShipmentService shipments, FulfillmentEventPublisher events) {
    this.eventsRepository = eventsRepository;
    this.shipments = shipments;
    this.events = events;
  }

  @Transactional
  public TrackingEventResponse add(UUID shipmentId, AddTrackingEventRequest request) {
    Shipment shipment = shipments.find(shipmentId);
    TrackingEvent saved = eventsRepository.save(new TrackingEvent(shipment, request.status(), request.location().trim(), request.description().trim(), request.eventTime()));
    if (shipment.getStatus() != request.status()) shipments.updateStatus(shipmentId, new UpdateShipmentStatusRequest(request.status()));
    events.publish(FulfillmentEventType.TRACKING_EVENT_ADDED, shipment.getFulfillment(), shipment, saved);
    return TrackingEventResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public List<TrackingEventResponse> history(UUID shipmentId) {
    shipments.find(shipmentId);
    return eventsRepository.findByShipment_IdOrderByEventTimeAsc(shipmentId).stream().map(TrackingEventResponse::from).toList();
  }
  @Transactional
  public void startDelivery(UUID shipmentId, String partnerId) {
    Shipment shipment=shipments.findForUpdate(shipmentId);
    if (partnerId==null || !partnerId.equals(shipment.getDeliveryPartnerId()))
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN,"This delivery is not assigned to you.");
    if (shipment.getStatus()==ShipmentStatus.OUT_FOR_DELIVERY) return;
    if (shipment.getStatus()!=ShipmentStatus.IN_TRANSIT)
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,"Pick up the order before starting delivery.");
    java.time.Instant assignedAt=shipment.getDeliveryAssignedAt()==null?java.time.Instant.EPOCH:shipment.getDeliveryAssignedAt();
    if (eventsRepository.findByShipment_IdOrderByEventTimeAsc(shipmentId).stream().noneMatch(event -> "Assignment accepted by delivery partner.".equals(event.getDescription()) && !event.getEventTime().isBefore(assignedAt)))
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,"Accept the assignment before starting delivery.");
    shipments.updateStatus(shipmentId,new UpdateShipmentStatusRequest(ShipmentStatus.OUT_FOR_DELIVERY));
    TrackingEvent saved=eventsRepository.save(new TrackingEvent(shipment,ShipmentStatus.OUT_FOR_DELIVERY,"Store delivery","Order is out for delivery.",java.time.Instant.now()));
    events.publish(FulfillmentEventType.TRACKING_EVENT_ADDED,shipment.getFulfillment(),shipment,saved);
  }

  @Transactional
  public void acceptAssignment(UUID shipmentId, String partnerId) {
    Shipment shipment=shipments.findForUpdate(shipmentId);
    if (partnerId==null || !partnerId.equals(shipment.getDeliveryPartnerId()))
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN,"This delivery is not assigned to you.");
    if (Set.of(ShipmentStatus.DELIVERED,ShipmentStatus.CANCELLED,ShipmentStatus.RETURNED,ShipmentStatus.FAILED).contains(shipment.getStatus()))
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,"This shipment is already finalized.");
    String description="Assignment accepted by delivery partner.";
    java.time.Instant assignedAt=shipment.getDeliveryAssignedAt()==null?java.time.Instant.EPOCH:shipment.getDeliveryAssignedAt();
    if (eventsRepository.findByShipment_IdOrderByEventTimeAsc(shipmentId).stream().anyMatch(event -> description.equals(event.getDescription()) && !event.getEventTime().isBefore(assignedAt))) return;
    TrackingEvent saved=eventsRepository.save(new TrackingEvent(shipment,shipment.getStatus(),"Store delivery",description,java.time.Instant.now()));
    events.publish(FulfillmentEventType.TRACKING_EVENT_ADDED,shipment.getFulfillment(),shipment,saved);
  }
}
