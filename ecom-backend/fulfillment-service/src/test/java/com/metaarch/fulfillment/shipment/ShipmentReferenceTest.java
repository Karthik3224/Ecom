package com.metaarch.fulfillment.shipment;

import com.metaarch.fulfillment.fulfillment.*;
import com.metaarch.fulfillment.event.FulfillmentEventPublisher;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ShipmentReferenceTest {
  @Test void backendGeneratesSavedUuidReferenceAndRepeatedCreationReusesShipment() {
    var repository = mock(ShipmentRepository.class);
    var fulfillments = mock(FulfillmentService.class);
    var events = mock(FulfillmentEventPublisher.class);
    var service = new ShipmentService(repository, fulfillments, events);
    var fulfillment = new Fulfillment(UUID.randomUUID(), UUID.randomUUID(), "store", FulfillmentType.SHIP_TO_HOME, UUID.randomUUID());
    var id = UUID.randomUUID(); ReflectionTestUtils.setField(fulfillment, "id", id);
    fulfillment.setStatus(FulfillmentStatus.READY_TO_SHIP);
    when(fulfillments.findForUpdate(id)).thenReturn(fulfillment);
    var saved = new AtomicReference<Shipment>();
    when(repository.findByOrderId(fulfillment.getOrderId())).thenAnswer(call -> Optional.ofNullable(saved.get()));
    when(repository.save(any(Shipment.class))).thenAnswer(call -> {
      Shipment value = call.getArgument(0); ReflectionTestUtils.setField(value, "id", UUID.randomUUID()); saved.set(value); return value;
    });
    var request = new CreateShipmentRequest(id, "Store Delivery", null, LocalDate.of(2026, 10, 12));
    var first = service.create(request); var repeated = service.create(request);
    assertThat(first.id()).isNotNull();
    assertThat(UUID.fromString(first.trackingNumber())).isNotNull();
    assertThat(first.trackingNumber()).doesNotStartWith("DEMO");
    assertThat(repeated.id()).isEqualTo(first.id());
    assertThat(repeated.trackingNumber()).isEqualTo(first.trackingNumber());
    verify(repository, times(1)).save(any(Shipment.class));
    assertThatThrownBy(() -> service.create(new CreateShipmentRequest(id, "Another carrier", null, request.estimatedDeliveryDate())))
      .isInstanceOf(com.metaarch.fulfillment.exception.ConflictException.class);
  }

  @Test void explicitCourierReferenceIsPreserved() {
    var repository = mock(ShipmentRepository.class); var fulfillments = mock(FulfillmentService.class);
    var service = new ShipmentService(repository, fulfillments, mock(FulfillmentEventPublisher.class));
    var id = UUID.randomUUID();
    var fulfillment = new Fulfillment(UUID.randomUUID(), UUID.randomUUID(), "store", FulfillmentType.SHIP_TO_HOME, UUID.randomUUID());
    ReflectionTestUtils.setField(fulfillment, "id", id); fulfillment.setStatus(FulfillmentStatus.READY_TO_SHIP);
    when(fulfillments.findForUpdate(id)).thenReturn(fulfillment);
    when(repository.findByOrderId(fulfillment.getOrderId())).thenReturn(Optional.empty());
    when(repository.save(any(Shipment.class))).thenAnswer(call -> call.getArgument(0));
    assertThat(service.create(new CreateShipmentRequest(id, "Assigned carrier", "verified-carrier-reference", LocalDate.of(2026,10,12))).trackingNumber())
      .isEqualTo("verified-carrier-reference");
  }
}
