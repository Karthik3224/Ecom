package com.metaarch.order.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.metaarch.order.exception.DeliveryQuoteVerificationException;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class CatalogDeliveryQuoteClientTest {
  private static final String BASE_URL = "http://catalog-service";

  @Test
  void resolvesApprovedCatalogLocations() {
    assertThat(resolve(1L, "hyderabad").locationId()).isEqualTo("hyderabad");
    assertThat(resolve(3L, "chennai").locationId()).isEqualTo("chennai");
    assertThat(resolve(8L, "bengaluru").locationId()).isEqualTo("bengaluru");
    assertThat(resolve(10L, "vijayawada").locationId()).isEqualTo("vijayawada");
  }

  @Test
  void rejectsUnknownDeliveryZone() {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    server.expect(once(), requestTo(BASE_URL + "/api/v1/stores/delivery-zones/999/location"))
      .andRespond(withSuccess("", MediaType.APPLICATION_JSON));

    CatalogDeliveryQuoteClient client = new CatalogDeliveryQuoteClient(builder, BASE_URL);

    assertThatThrownBy(() -> client.resolveLocation(999L))
      .isInstanceOf(DeliveryQuoteVerificationException.class);
  }

  @Test
  void rejectsDeliveryZoneWithoutLocation() {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    server.expect(once(), requestTo(BASE_URL + "/api/v1/stores/delivery-zones/4/location"))
      .andRespond(withSuccess("{\"deliveryZoneId\":4,\"storeId\":\"store-banjara\",\"locationId\":null}", MediaType.APPLICATION_JSON));

    CatalogDeliveryQuoteClient client = new CatalogDeliveryQuoteClient(builder, BASE_URL);

    assertThatThrownBy(() -> client.resolveLocation(4L))
      .isInstanceOf(DeliveryQuoteVerificationException.class)
      .hasMessageContaining("no authoritative location mapping");
  }

  private CatalogDeliveryQuoteClient.DeliveryZoneLocation resolve(Long zoneId, String locationId) {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    server.expect(once(), requestTo(BASE_URL + "/api/v1/stores/delivery-zones/" + zoneId + "/location"))
      .andRespond(withSuccess("{\"deliveryZoneId\":" + zoneId + ",\"storeId\":\"store\",\"locationId\":\"" + locationId + "\"}", MediaType.APPLICATION_JSON));
    return new CatalogDeliveryQuoteClient(builder, BASE_URL).resolveLocation(zoneId);
  }
}
