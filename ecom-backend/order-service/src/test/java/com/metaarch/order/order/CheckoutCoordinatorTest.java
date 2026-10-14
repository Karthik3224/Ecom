package com.metaarch.order.order;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metaarch.sync.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(properties={"spring.cloud.config.enabled=false","eureka.client.enabled=false",
  "spring.datasource.url=jdbc:h2:mem:checkout_coordinator;MODE=MySQL;DB_CLOSE_DELAY=-1",
  "spring.datasource.driver-class-name=org.h2.Driver","spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
  "spring.sql.init.mode=always","spring.sql.init.schema-locations=classpath:sync-schema.sql",
  "sync.dispatch-enabled=false","checkout.multi-store.enabled=true","sync.service=order-service",
  "sync.routes.checkout-reservation=inventory-service","sync.targets.inventory-service=http://127.0.0.1:1",
  "sync.routes.order=payment-service","sync.targets.payment-service=http://127.0.0.1:1",
  "sync.keys.inventory-service=inventory-qualification-only-key-000000000000"})
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
class CheckoutCoordinatorTest {
  @Autowired CheckoutCoordinator coordinator;
  @Autowired CheckoutGroups groups;
  @Autowired JdbcTemplate jdbc;
  @Autowired ObjectMapper mapper;
  @Autowired OrderRepository orders;
  @Autowired PlatformTransactionManager manager;
  @Autowired org.springframework.test.web.servlet.MockMvc mvc;
  @Autowired SyncAuthentication syncAuthentication;
  @MockBean org.springframework.security.oauth2.jwt.JwtDecoder decoder;
  @MockBean CatalogDeliveryQuoteClient catalog;
  @MockBean CheckoutCartClient carts;
  @SpyBean OrderService orderService;
  UUID owner;

  @BeforeEach void setup() {
    owner=UUID.randomUUID();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(Jwt.withTokenValue("verified-test-context").header("alg","HS256").claim("customerId",owner.toString()).build(),List.of()));
    when(decoder.decode("owner")).thenReturn(Jwt.withTokenValue("owner").header("alg","HS256").claim("customerId",owner.toString()).build());
    when(decoder.decode("stranger")).thenReturn(Jwt.withTokenValue("stranger").header("alg","HS256").claim("customerId",UUID.randomUUID().toString()).build());
    when(decoder.decode("invalid")).thenThrow(new org.springframework.security.oauth2.jwt.BadJwtException("Invalid signature"));
    when(decoder.decode("expired")).thenThrow(new org.springframework.security.oauth2.jwt.BadJwtException("Expired token"));
    jdbc.execute("CREATE TABLE IF NOT EXISTS checkout_groups(id VARCHAR(36) PRIMARY KEY,customer_id VARCHAR(36),request_key VARCHAR(128),request_hash VARCHAR(64),request_payload CLOB,state VARCHAR(32),handling_policy VARCHAR(32),aggregate_total DECIMAL(19,2),updated_at TIMESTAMP,UNIQUE(customer_id,request_key))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS checkout_children(checkout_id VARCHAR(36),store_id VARCHAR(100),cart_id VARCHAR(36) UNIQUE,order_id VARCHAR(36) UNIQUE,reservation_id VARCHAR(36) NOT NULL UNIQUE,state VARCHAR(32),handling_fee DECIMAL(19,2),PRIMARY KEY(checkout_id,store_id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS checkout_audit(id VARCHAR(36) PRIMARY KEY,checkout_id VARCHAR(36),previous_state VARCHAR(32),next_state VARCHAR(32),actor VARCHAR(36))");
    jdbc.update("DELETE FROM checkout_audit");jdbc.update("DELETE FROM checkout_children");jdbc.update("DELETE FROM checkout_groups");
    jdbc.update("DELETE FROM sync_outbox");
    orders.deleteAll();
    reset(catalog,carts);
    when(catalog.verifyItem(anyString(),any(),anyBoolean(),anyBoolean())).thenAnswer(call->call.getArgument(1));
  }
  @AfterEach void cleanup(){SecurityContextHolder.clearContext();}
  List<CreateOrderRequest> requests(int count) throws Exception {
    var result=new ArrayList<CreateOrderRequest>();
    for(int i=0;i<count;i++) result.add(mapper.readValue("""
      {"customerId":"%s","cartId":"%s","storeId":"store-%s",
      "items":[{"productId":"%s","variantId":"%s","productName":"Product %s","quantity":2,"unitPrice":10}],
      "deliveryMethod":"pickup","fulfillmentType":"pickup","deliveryCharge":0}
      """.formatted(owner,UUID.randomUUID(),i,UUID.randomUUID(),UUID.randomUUID(),i),CreateOrderRequest.class));
    return result;
  }
  void reply(UUID group,CreateOrderRequest request,String action,String state) {
    UUID child=UUID.fromString(jdbc.queryForObject("SELECT reservation_id FROM checkout_children WHERE checkout_id=? AND store_id=?",String.class,group.toString(),request.storeId()));
    var lines=request.items().stream().map(item->new CheckoutInventoryEvent.Line(item.productId(),item.variantId(),item.quantity())).toList();
    new TransactionTemplate(manager).executeWithoutResult(status->coordinator.receive(new CheckoutInventoryEvent(UUID.randomUUID(),group,owner,child,request.storeId(),action,lines,state)));
  }
  void completes(int count) throws Exception {
    var requests=requests(count);
    String key=UUID.randomUUID().toString();
    var group=coordinator.submit(key,requests);
    assertThat(group.state()).isEqualTo("RESERVING");
    for(var request:requests) reply(group.id(),request,"RESERVE","RESERVED");
    var committing=groups.get(group.id());
    assertThat(committing.state()).isEqualTo("COMMITTING");
    assertThat(committing.children()).hasSize(count).allSatisfy(child->{
      var order=orderService.get(child.orderId());
      assertThat(order.storeId()).isEqualTo(child.storeId());
      assertThat(order.handlingFee()).isEqualByComparingTo("5.00");
      assertThat(order.totalAmount()).isEqualByComparingTo("25.00");
      assertThat(order.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
      assertThat(order.items()).hasSize(1);
    });
    assertThat(committing.aggregateTotal()).isEqualByComparingTo(Integer.toString(count*25));
    reply(group.id(),requests.getFirst(),"RESERVE","RESERVED");
    assertThat(orders.count()).isEqualTo(count);
    for(var request:requests) reply(group.id(),request,"CONFIRM","CONFIRMED");
    assertThat(groups.get(group.id()).state()).isEqualTo("COMPLETED");
    assertThat(coordinator.submit(key,requests).id()).isEqualTo(group.id());
    assertThat(orders.count()).isEqualTo(count);
  }
  @Test void twoStoresCommitCorrectTotalsAndRetryWithoutDuplicateOrders() throws Exception {completes(2);}
  @Test void threeStoresCommitCorrectTotalsAndRetryWithoutDuplicateOrders() throws Exception {completes(3);}
  @Test void recoveryRequeuesOnlyOwnedDeadInventoryCommandsAndIsIdempotent() throws Exception {
    var group=coordinator.submit(UUID.randomUUID().toString(),requests(2));
    long commands=jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox WHERE aggregate_id=?",Long.class,group.id().toString());
    jdbc.update("UPDATE sync_outbox SET state='DEAD',attempts=9 WHERE aggregate_id=?",group.id().toString());
    assertThat(groups.get(group.id()).recoveryRequired()).isTrue();
    assertThat(coordinator.retry(group.id()).state()).isEqualTo("RESERVING");
    assertThat(groups.get(group.id()).recoveryRequired()).isFalse();
    long audits=jdbc.queryForObject("SELECT COUNT(*) FROM checkout_audit WHERE checkout_id=?",Long.class,group.id().toString());
    coordinator.retry(group.id());
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_audit WHERE checkout_id=?",Long.class,group.id().toString())).isEqualTo(audits);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox WHERE aggregate_id=?",Long.class,group.id().toString())).isEqualTo(commands+4);
    assertThat(jdbc.queryForObject("SELECT COUNT(DISTINCT reservation_id) FROM checkout_children WHERE checkout_id=?",Integer.class,group.id().toString())).isEqualTo(2);
    assertThat(orders.count()).isZero();
  }
  @Test void recoveryHttpRejectsCrossUserAndMissingAuthentication() throws Exception {
    var group=coordinator.submit(UUID.randomUUID().toString(),requests(2));
    String path="/api/v1/checkouts/"+group.id()+"/retry";
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).header("Authorization","Bearer stranger")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    assertThat(jdbc.queryForObject("SELECT state FROM checkout_groups WHERE id=?",String.class,group.id().toString())).isEqualTo("RESERVING");
  }
  @Test void rejectedSecondStoreCompensatesAllAndCannotReportSuccess() throws Exception {
    var requests=requests(3);
    var group=coordinator.submit(UUID.randomUUID().toString(),requests);
    reply(group.id(),requests.getFirst(),"RESERVE","RESERVED");
    reply(group.id(),requests.get(1),"RESERVE","REJECTED");
    assertThat(groups.get(group.id()).state()).isEqualTo("COMPENSATING");
    assertThat(orders.count()).isZero();
    reply(group.id(),requests.get(2),"RESERVE","RESERVED");
    assertThat(groups.get(group.id()).state()).isEqualTo("COMPENSATING");
    for(var request:requests) reply(group.id(),request,"RELEASE","RELEASED");
    assertThat(groups.get(group.id()).state()).isEqualTo("FAILED");
    reply(group.id(),requests.getFirst(),"CONFIRM","CONFIRMED");
    assertThat(groups.get(group.id()).state()).isEqualTo("FAILED");
  }
  @Test void secondChildFailureRollsBackAllChildrenAndOutboxThenRetryRecovers() throws Exception {
    var requests=requests(2);
    var group=coordinator.submit(UUID.randomUUID().toString(),requests);
    reply(group.id(),requests.getFirst(),"RESERVE","RESERVED");
    long before=jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox",Long.class);
    doThrow(new IllegalStateException("Injected second child persistence failure")).when(orderService).create(argThat(request->request.storeId().equals("store-1")));
    assertThatThrownBy(()->reply(group.id(),requests.get(1),"RESERVE","RESERVED")).isInstanceOf(IllegalStateException.class);
    assertThat(orders.count()).isZero();
    assertThat(groups.get(group.id()).state()).isEqualTo("RESERVING");
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox",Long.class)).isEqualTo(before);
    doCallRealMethod().when(orderService).create(any());
    reply(group.id(),requests.get(1),"RESERVE","RESERVED");
    assertThat(orders.count()).isEqualTo(2);
    assertThat(groups.get(group.id()).state()).isEqualTo("COMMITTING");
  }
  @Test void prematureConfirmationAndDuplicateRepliesCannotSkipReservation() throws Exception {
    var requests=requests(2);
    var group=coordinator.submit(UUID.randomUUID().toString(),requests);
    reply(group.id(),requests.getFirst(),"CONFIRM","CONFIRMED");
    reply(group.id(),requests.getFirst(),"RESERVE","RESERVED");
    reply(group.id(),requests.getFirst(),"RESERVE","RESERVED");
    assertThat(groups.get(group.id()).state()).isEqualTo("RESERVING");
    assertThat(orders.count()).isZero();
  }

  @Test void checkoutHttpRequiresOwnerAndRejectsExpiredOrMissingAuthentication() throws Exception {
    var requests=requests(2);
    String key=UUID.randomUUID().toString();
    var group=coordinator.submit(key,requests);
    String lookup="/api/v1/checkouts/by-key/"+key;
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(lookup)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
    for(String token:List.of("invalid","expired")) mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(lookup).header("Authorization","Bearer "+token)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(lookup).header("Authorization","Bearer stranger")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isNotFound());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(lookup).header("Authorization","Bearer owner")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
    String path="/api/v1/checkouts/"+group.id();
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
    for(String token:List.of("invalid","expired")) mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path).header("Authorization","Bearer "+token)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path).header("Authorization","Bearer stranger")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path).header("Authorization","Bearer owner")).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/checkouts").header("Authorization","Bearer stranger").header("Idempotency-Key",UUID.randomUUID().toString())
      .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("stores",requests)))).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM checkout_groups",Integer.class)).isEqualTo(1);
  }

  @Test void inventoryReplyUsesSignedInboxAndDuplicateBodyHasNoSideEffects() throws Exception {
    var requests=requests(2);
    var group=coordinator.submit(UUID.randomUUID().toString(),requests);
    var request=requests.getFirst();
    UUID child=UUID.fromString(jdbc.queryForObject("SELECT reservation_id FROM checkout_children WHERE checkout_id=? AND store_id=?",String.class,group.id().toString(),request.storeId()));
    UUID event=UUID.randomUUID();
    var payload=new CheckoutInventoryEvent(event,group.id(),owner,child,request.storeId(),"RESERVE",request.items().stream().map(item->new CheckoutInventoryEvent.Line(item.productId(),item.variantId(),item.quantity())).toList(),"RESERVED");
    byte[] body=mapper.writeValueAsBytes(new SyncEnvelope(event,"inventory-service","checkout-reservation-result",group.id().toString(),mapper.valueToTree(payload)));
    String time=Long.toString(java.time.Instant.now().getEpochSecond());
    String signature=syncAuthentication.sign("inventory-service",time,body);
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/internal/events").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isUnauthorized());
    for(int i=0;i<2;i++) mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/internal/events").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body)
      .header("X-Sync-Source","inventory-service").header("X-Sync-Time",time).header("X-Sync-Signature",signature)).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isNoContent());
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_inbox WHERE event_id=?",Integer.class,event.toString())).isEqualTo(1);
    assertThat(orders.count()).isZero();
  }
}
