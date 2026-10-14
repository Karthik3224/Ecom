package com.metaarch.catalog.store;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class OpenRouteServiceClientTest {
  @Test
  void blankApiKeyUsesDeterministicFallbackRoute() {
    OpenRouteServiceClient client = new OpenRouteServiceClient(RestClient.builder(), " ");

    OpenRouteServiceClient.RouteResult route = client.drivingRoute(
      new BigDecimal("17.4446"),
      new BigDecimal("78.4483"),
      new BigDecimal("17.4410"),
      new BigDecimal("78.3917")
    );

    assertThat(client.configured()).isFalse();
    assertThat(route.distanceMeters()).isPositive();
    assertThat(route.durationSeconds()).isGreaterThanOrEqualTo(60);
    assertThat(route.distanceKm()).isPositive();
    assertThat(route.durationMinutes()).isPositive();
    assertThat(route.geometry()).isNull();
  }
}
