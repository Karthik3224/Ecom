package com.metaarch.order.order;

import com.metaarch.order.event.OrderEventPublisher;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalPickupValidationTest {
  @Test void globalPickupCannotCreateAnOrder() throws Exception {
    var orders = mock(OrderRepository.class, withSettings().mockMaker(org.mockito.MockMakers.SUBCLASS));
    var events = mock(OrderEventPublisher.class);
    var service = new OrderService(orders, mock(OrderItemRepository.class), events, mock(CatalogDeliveryQuoteClient.class));
    var request = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules().readValue(
        "{\"deliveryMethod\":\"pickup\",\"fulfillmentType\":\"global\",\"storeId\":\"global-store\"}", CreateOrderRequest.class);
    assertThrows(IllegalArgumentException.class, () -> service.create(request));
    verifyNoInteractions(orders, events);
  }
}
