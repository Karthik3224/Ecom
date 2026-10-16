package com.metaarch.order.order;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import com.metaarch.order.exception.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
class FulfillmentDeliveryClientTest {
  private final UUID order = UUID.randomUUID(), fulfillment = UUID.randomUUID(), customer = UUID.randomUUID();
  private final RestClient.Builder builder = RestClient.builder().baseUrl("http://fulfillment");
  private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
  private final FulfillmentDeliveryClient client = new FulfillmentDeliveryClient(builder.build());
  private void responses(String status, UUID shipmentOrder, UUID shipmentFulfillment, String deliveredAt) {
    server.expect(requestTo("http://fulfillment/api/v1/fulfillments/order/"+order)).andExpect(header("Authorization", "Bearer test-customer"))
      .andRespond(withSuccess("{\"id\":\"%s\",\"orderId\":\"%s\",\"customerId\":\"%s\",\"storeId\":\"store-a\",\"status\":\"%s\"}".formatted(fulfillment,order,customer,status), MediaType.APPLICATION_JSON));
    server.expect(requestTo("http://fulfillment/api/v1/shipments/order/"+order)).andExpect(header("Authorization", "Bearer test-customer"))
      .andRespond(withSuccess("{\"id\":\"%s\",\"orderId\":\"%s\",\"fulfillmentId\":\"%s\",\"status\":\"%s\",\"deliveredAt\":%s}".formatted(UUID.randomUUID(),shipmentOrder,shipmentFulfillment,status,deliveredAt), MediaType.APPLICATION_JSON));
  }
  @Test void validatesPersistedDeliveryWithForwardedCustomerAuthorization() {
    responses("DELIVERED",order,fulfillment,"\"2026-10-16T03:00:00Z\"");
    var evidence=client.verify(order,"Bearer test-customer").orElseThrow();
    assertThat(evidence.customerId()).isEqualTo(customer);assertThat(evidence.storeId()).isEqualTo("store-a");server.verify();
  }
  @Test void undeliveredShipmentReturnsNoEvidence() {
    responses("SHIPPED",order,fulfillment,"null");assertThat(client.verify(order,"Bearer test-customer")).isEmpty();server.verify();
  }
  @Test void mismatchedOrderFailsClosed() {
    responses("DELIVERED",UUID.randomUUID(),fulfillment,"\"2026-10-16T03:00:00Z\"");
    assertThatThrownBy(()->client.verify(order,"Bearer test-customer")).isInstanceOf(InvalidOrderStateException.class);
  }
  @Test void mismatchedFulfillmentFailsClosed() {
    responses("DELIVERED",order,UUID.randomUUID(),"\"2026-10-16T03:00:00Z\"");
    assertThatThrownBy(()->client.verify(order,"Bearer test-customer")).isInstanceOf(InvalidOrderStateException.class);
  }
  @Test void missingCompletionTimestampFailsClosed() {
    responses("DELIVERED",order,fulfillment,"null");assertThatThrownBy(()->client.verify(order,"Bearer test-customer")).isInstanceOf(InvalidOrderStateException.class);
  }
  @Test void upstreamFailureCannotMakeOrderEligible() {
    server.expect(requestTo("http://fulfillment/api/v1/fulfillments/order/"+order)).andRespond(withServerError());
    assertThatThrownBy(()->client.verify(order,"Bearer test-customer")).isInstanceOf(DeliveryQuoteVerificationException.class);
  }
}
