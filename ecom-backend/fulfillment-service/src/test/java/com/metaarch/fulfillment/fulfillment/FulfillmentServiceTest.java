package com.metaarch.fulfillment.fulfillment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import java.util.UUID;
import com.metaarch.fulfillment.event.FulfillmentEventPublisher;
import com.metaarch.fulfillment.exception.ConflictException;
import com.metaarch.fulfillment.exception.ResourceNotFoundException;
import com.metaarch.fulfillment.exception.InvalidFulfillmentStateException;
import org.junit.jupiter.api.Test;

class FulfillmentServiceTest {
  private final FulfillmentRepository repository = mock(FulfillmentRepository.class);
  private final FulfillmentEventPublisher publisher = mock(FulfillmentEventPublisher.class);
  private final FulfillmentService service = new FulfillmentService(repository, publisher);

  @Test
  void rejectsInvalidFinalStateTransition() {
    Fulfillment fulfillment = new Fulfillment(UUID.randomUUID(), UUID.randomUUID(), "store-1", FulfillmentType.SHIP_TO_HOME, UUID.randomUUID());
    fulfillment.setStatus(FulfillmentStatus.DELIVERED);
    when(repository.findById(fulfillment.getId())).thenReturn(java.util.Optional.of(fulfillment));

    assertThatThrownBy(() -> service.updateStatus(fulfillment.getId(), new UpdateFulfillmentStatusRequest(FulfillmentStatus.CANCELLED)))
      .isInstanceOf(InvalidFulfillmentStateException.class);
  }

  @Test
  void createsFulfillmentAndPublishesCreationEvent() {
    UUID orderId = UUID.randomUUID();
    CreateFulfillmentRequest request = new CreateFulfillmentRequest(orderId, UUID.randomUUID(), " store-1 ",
        UUID.randomUUID(), FulfillmentType.SHIP_TO_HOME);
    when(repository.findByOrderId(orderId)).thenReturn(java.util.Optional.empty());
    when(repository.save(org.mockito.ArgumentMatchers.any(Fulfillment.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Fulfillment saved = service.createEntity(request);

    assertThat(saved.getStoreId()).isEqualTo("store-1");
    assertThat(saved.getStatus()).isEqualTo(FulfillmentStatus.PENDING);
    org.mockito.Mockito.verify(publisher).publish(com.metaarch.fulfillment.event.FulfillmentEventType.FULFILLMENT_CREATED, saved, null, null);
  }

  @Test
  void rejectsDuplicateFulfillment() {
    UUID orderId = UUID.randomUUID();
    Fulfillment existing = new Fulfillment(orderId, UUID.randomUUID(), "store-1", FulfillmentType.SHIP_TO_HOME, null);
    when(repository.findByOrderId(orderId)).thenReturn(java.util.Optional.of(existing));

    assertThatThrownBy(() -> service.createEntity(new CreateFulfillmentRequest(orderId, UUID.randomUUID(), "store-1", null,
        FulfillmentType.SHIP_TO_HOME))).isInstanceOf(ConflictException.class);
  }

  @Test
  void findsFulfillmentByIdAndReportsMissingRecords() {
    UUID id = UUID.randomUUID();
    Fulfillment fulfillment = new Fulfillment(UUID.randomUUID(), UUID.randomUUID(), "store-1", FulfillmentType.STORE_PICKUP, null);
    when(repository.findById(id)).thenReturn(java.util.Optional.of(fulfillment));
    assertThat(service.find(id)).isSameAs(fulfillment);

    UUID missing = UUID.randomUUID();
    when(repository.findById(missing)).thenReturn(java.util.Optional.empty());
    assertThatThrownBy(() -> service.find(missing)).isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void cancelsAllowedFulfillmentAndLeavesShippedFulfillmentUntouched() {
    UUID orderId = UUID.randomUUID();
    Fulfillment pending = new Fulfillment(orderId, UUID.randomUUID(), "store-1", FulfillmentType.SHIP_TO_HOME, null);
    when(repository.findByOrderId(orderId)).thenReturn(java.util.Optional.of(pending));
    service.cancelByOrderIfAllowed(orderId);
    assertThat(pending.getStatus()).isEqualTo(FulfillmentStatus.CANCELLED);

    Fulfillment shipped = new Fulfillment(UUID.randomUUID(), UUID.randomUUID(), "store-1", FulfillmentType.SHIP_TO_HOME, null);
    shipped.setStatus(FulfillmentStatus.SHIPPED);
    UUID shippedOrder = UUID.randomUUID();
    when(repository.findByOrderId(shippedOrder)).thenReturn(java.util.Optional.of(shipped));
    service.cancelByOrderIfAllowed(shippedOrder);
    assertThat(shipped.getStatus()).isEqualTo(FulfillmentStatus.SHIPPED);
  }

  @Test
  void advancesStatusAndPublishesTheTransition() {
    UUID id = UUID.randomUUID();
    Fulfillment fulfillment = new Fulfillment(UUID.randomUUID(), UUID.randomUUID(), "store-1", FulfillmentType.SHIP_TO_HOME, null);
    when(repository.findById(id)).thenReturn(java.util.Optional.of(fulfillment));

    service.updateStatus(id, new UpdateFulfillmentStatusRequest(FulfillmentStatus.ALLOCATED));

    assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.ALLOCATED);
    org.mockito.Mockito.verify(publisher).publish(com.metaarch.fulfillment.event.FulfillmentEventType.FULFILLMENT_STATUS_UPDATED, fulfillment, null, null);
  }
}
