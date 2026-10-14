package com.metaarch.order.order;

import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.client.RestClient;

class CheckoutCartClientTest {
  HttpServer server; CheckoutCartClient client; CreateOrderRequest request;
  AtomicReference<String> authorization=new AtomicReference<>();
  AtomicReference<String> path=new AtomicReference<>();
  int status=200; String response;
  @BeforeEach void prepare() throws Exception {
    request=new ObjectMapper().readValue("""
      {"customerId":"%s","cartId":"%s","storeId":"store","items":[{"productId":"%s","productName":"Test","quantity":1,"unitPrice":10}],"deliveryMethod":"pickup"}
      """.formatted(UUID.randomUUID(),UUID.randomUUID(),UUID.randomUUID()),CreateOrderRequest.class);
    response="{\"id\":\""+request.cartId()+"\",\"customerId\":\""+request.customerId()+"\",\"storeId\":\"store\",\"status\":\"CHECKED_OUT\"}";
    server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
    server.createContext("/",exchange -> {
      authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));path.set(exchange.getRequestURI().getPath());
      exchange.getRequestBody().readAllBytes();byte[] bytes=response.getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().set("Content-Type","application/json");exchange.sendResponseHeaders(status,bytes.length);
      exchange.getResponseBody().write(bytes);exchange.close();
    });server.start();
    client=new CheckoutCartClient(RestClient.builder(),"http://127.0.0.1:"+server.getAddress().getPort());
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(Jwt.withTokenValue("verified-test-token")
      .header("alg","HS512").claim("customerId",request.customerId().toString()).build()));
  }
  @AfterEach void cleanup() { SecurityContextHolder.clearContext();server.stop(0); }
  @Test void ownerClaimUsesVerifiedTokenAndActualCartId() {
    client.claim(request,"a".repeat(64));
    assertThat(authorization.get()).isEqualTo("Bearer verified-test-token");
    assertThat(path.get()).isEqualTo("/api/v1/carts/"+request.cartId()+"/checkout-claim");
  }
  @Test void forbiddenAndSubstitutedCartOwnerAreRejected() {
    status=403;assertThatThrownBy(() -> client.claim(request,"a".repeat(64))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    status=200;response=response.replace(request.customerId().toString(),UUID.randomUUID().toString());
    assertThatThrownBy(() -> client.claim(request,"a".repeat(64))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
  }
  @Test void missingAuthenticationMakesNoHttpCall() {
    SecurityContextHolder.clearContext();assertThatThrownBy(() -> client.claim(request,"a".repeat(64))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    assertThat(path.get()).isNull();
  }
  @Test void serviceUnavailableFailsClosed() {
    status=503;assertThatThrownBy(() -> client.claim(request,"a".repeat(64))).isInstanceOf(com.metaarch.order.exception.DeliveryQuoteVerificationException.class);
    server.stop(0);assertThatThrownBy(() -> client.claim(request,"a".repeat(64))).isInstanceOf(com.metaarch.order.exception.DeliveryQuoteVerificationException.class);
  }
}
