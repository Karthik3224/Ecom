package com.metaarch.order.order;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
  "spring.cloud.config.enabled=false", "eureka.client.enabled=false",
  "spring.datasource.url=jdbc:h2:mem:delivery_real_http_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
  "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
  "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect", "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
  "spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false",
  "spring.sql.init.mode=always", "spring.sql.init.schema-locations=classpath:sync-schema.sql",
  "sync.dispatch-enabled=false", "sync.keys.payment-service=test-payment-key-at-least-32-characters",
  "sync.keys.fulfillment-service=test-fulfillment-key-at-least-32-characters",
  "sync.service=order-service", "sync.routes.order=payment-service,fulfillment-service,notification-service",
  "sync.targets.payment-service=http://127.0.0.1:1", "sync.targets.fulfillment-service=http://127.0.0.1:1", "sync.targets.notification-service=http://127.0.0.1:1"
})

class DeliveryReconciliationRealHttpTest {
  private static final UUID FULFILLMENT = UUID.randomUUID();
  private static volatile Order fixture;
  private static HttpServer downstream;
  @DynamicPropertySource static void downstream(DynamicPropertyRegistry properties) throws Exception {
    downstream = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    downstream.createContext("/api/v1/", exchange -> {
      String body = exchange.getRequestURI().getPath().contains("/fulfillments/")
          ? "{\"id\":\"%s\",\"orderId\":\"%s\",\"customerId\":\"%s\",\"storeId\":\"test-store\",\"status\":\"DELIVERED\"}".formatted(FULFILLMENT,fixture.getId(),fixture.getCustomerId())
          : "{\"id\":\"%s\",\"orderId\":\"%s\",\"fulfillmentId\":\"%s\",\"status\":\"DELIVERED\",\"deliveredAt\":\"2026-10-16T04:00:00Z\"}".formatted(UUID.randomUUID(),fixture.getId(),FULFILLMENT);
      byte[] bytes=body.getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().set("Content-Type","application/json");exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();
    });
    downstream.start();
    properties.add("FULFILLMENT_SERVICE_URL",()->"http://127.0.0.1:"+downstream.getAddress().getPort());
  }
  @AfterAll static void stop(){if(downstream!=null)downstream.stop(0);}
  @org.springframework.boot.test.mock.mockito.MockBean org.springframework.security.oauth2.jwt.JwtDecoder decoder;
  @Autowired OrderRepository orders;
  @Autowired TestRestTemplate http;
  @Test void realHttpClientReconcilesPopulatedOrderWithPendingPayment() {
    var customer=UUID.randomUUID();
    when(decoder.decode(anyString())).thenAnswer(call -> org.springframework.security.oauth2.jwt.Jwt.withTokenValue(call.getArgument(0)).header("alg","HS512").subject("test-owner").claim("customerId",customer.toString()).claim("accountType","customer").build());
    var order=new Order(customer,UUID.randomUUID(),"test-store",UUID.randomUUID().toString());
    order.addItem(new OrderItem(UUID.randomUUID(),null,"Test Pickle",1,new BigDecimal("100")));
    order.addAddress(new OrderAddress(AddressType.SHIPPING,"Test street",null,"Hyderabad","Telangana","India","500038","Test Customer","9000000000"));
    fixture=orders.saveAndFlush(order);
    var headers=new HttpHeaders();headers.setBearerAuth("test-session");
    var result=http.postForEntity("/api/v1/orders/"+fixture.getId()+"/reconcile-delivery",new HttpEntity<>(headers),String.class);
    assertThat(result.getStatusCode()).withFailMessage(result.getBody()).isEqualTo(HttpStatus.OK);
    assertThat(result.getBody()).contains("DELIVERED","PENDING");
    assertThat(orders.findById(fixture.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.DELIVERED);
  }
}
