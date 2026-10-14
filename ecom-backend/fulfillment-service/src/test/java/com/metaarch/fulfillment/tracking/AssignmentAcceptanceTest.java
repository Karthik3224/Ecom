package com.metaarch.fulfillment.tracking;
import java.time.Instant;
import java.util.*;
import com.metaarch.fulfillment.shipment.*;
import com.metaarch.fulfillment.event.FulfillmentEventPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class AssignmentAcceptanceTest {
  @Test void startRequiresCurrentAcceptanceAndAssignedPartnerAndIsRetrySafe() {
    var repository=mock(TrackingEventRepository.class);
    var shipments=mock(ShipmentService.class);
    var publisher=mock(FulfillmentEventPublisher.class);
    var shipment=mock(Shipment.class);
    var id=UUID.randomUUID();
    when(shipments.findForUpdate(id)).thenReturn(shipment);
    when(shipment.getDeliveryPartnerId()).thenReturn("81");
    when(shipment.getStatus()).thenReturn(ShipmentStatus.IN_TRANSIT);
    when(shipment.getDeliveryAssignedAt()).thenReturn(Instant.EPOCH);
    when(repository.findByShipment_IdOrderByEventTimeAsc(id)).thenReturn(List.of());
    var service=new TrackingService(repository,shipments,publisher);
    assertThrows(ResponseStatusException.class,()->service.startDelivery(id,"76"));
    assertThrows(ResponseStatusException.class,()->service.startDelivery(id,"81"));
    var accepted=new TrackingEvent(shipment,ShipmentStatus.IN_TRANSIT,"Store delivery","Assignment accepted by delivery partner.",Instant.now());
    when(repository.findByShipment_IdOrderByEventTimeAsc(id)).thenReturn(List.of(accepted));
    service.startDelivery(id,"81");
    verify(shipments).updateStatus(eq(id),any(UpdateShipmentStatusRequest.class));
    when(shipment.getStatus()).thenReturn(ShipmentStatus.OUT_FOR_DELIVERY);
    service.startDelivery(id,"81");
    verify(repository,times(1)).save(any());
    when(shipment.getStatus()).thenReturn(ShipmentStatus.DELIVERED);
    assertThrows(ResponseStatusException.class,()->service.startDelivery(id,"81"));
  }
  @Test void acceptanceIsScopedAndRetriesDoNotDuplicateEvents() {
    var repository=mock(TrackingEventRepository.class);
    var shipments=mock(ShipmentService.class);
    var publisher=mock(FulfillmentEventPublisher.class);
    var shipment=mock(Shipment.class);
    var id=UUID.randomUUID();
    when(shipments.findForUpdate(id)).thenReturn(shipment);
    when(shipment.getDeliveryPartnerId()).thenReturn("81");
    when(shipment.getStatus()).thenReturn(ShipmentStatus.IN_TRANSIT);
    when(shipment.getDeliveryAssignedAt()).thenReturn(Instant.EPOCH);
    var service=new TrackingService(repository,shipments,publisher);
    assertThrows(ResponseStatusException.class,()->service.acceptAssignment(id,"76"));
    verify(repository,never()).save(any());
    when(repository.findByShipment_IdOrderByEventTimeAsc(id)).thenReturn(List.of());
    service.acceptAssignment(id,"81");
    var accepted=new TrackingEvent(shipment,ShipmentStatus.IN_TRANSIT,"Store delivery","Assignment accepted by delivery partner.",Instant.now());
    when(repository.findByShipment_IdOrderByEventTimeAsc(id)).thenReturn(List.of(accepted));
    service.acceptAssignment(id,"81");
    verify(repository,times(1)).save(any());
    when(shipment.getStatus()).thenReturn(ShipmentStatus.DELIVERED);
    assertThrows(ResponseStatusException.class,()->service.acceptAssignment(id,"81"));
    verify(repository,times(1)).save(any());
  }
}
