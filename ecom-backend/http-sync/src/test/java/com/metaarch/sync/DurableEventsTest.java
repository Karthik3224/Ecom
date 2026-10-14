package com.metaarch.sync;

import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.nio.file.Path;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

class DurableEventsTest {
  @TempDir Path directory;
  JdbcTemplate jdbc;
  DriverManagerDataSource database;
  ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
  MutableClock clock = new MutableClock();
  SyncProperties properties;
  DataSourceTransactionManager manager;
  HttpServer server;

  @BeforeEach void initialize() {
    database = new DriverManagerDataSource("jdbc:h2:file:" + directory.resolve("sync") + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE", "sa", "");
    new ResourceDatabasePopulator(new ClassPathResource("sync-schema.sql")).execute(database);
    jdbc = new JdbcTemplate(database);
    jdbc.execute("CREATE TABLE test_orders(id VARCHAR(128) PRIMARY KEY, status VARCHAR(16), changes INT)");
    jdbc.update("INSERT INTO test_orders VALUES ('order-1','PENDING',0)");
    manager = new DataSourceTransactionManager(database);
    properties = new SyncProperties();
    properties.setService("payment-service");
    properties.getKeys().put("payment-service", "test-payment-key-at-least-32-characters");
    properties.getRoutes().put("payment", "order-service");
    properties.getTargets().put("order-service", "http://127.0.0.1:1");
  }
  @AfterEach void stop() { if (server != null) server.stop(0); }
  DurableEvents receiver() {
    EventHandler handler = new EventHandler() {
      public String kind() { return "payment"; }
      public String source() { return "payment-service"; }
      public void handle(JsonNode payload) {
        if (!"SUCCESS".equals(payload.path("status").asText())) throw new IllegalArgumentException("Unverified status");
        jdbc.update("UPDATE test_orders SET status='SUCCESS',changes=changes+1 WHERE id='order-1'");
      }
    };
    return new DurableEvents(jdbc, mapper, properties, manager, List.of(handler), clock);
  }
  SyncEnvelope event() {
    UUID id = UUID.randomUUID();
    return new SyncEnvelope(id, "payment-service", "payment", "order-1",
      mapper.valueToTree(Map.of("eventId", id.toString(), "orderId", "order-1", "status", "SUCCESS")));
  }
  void enqueue(SyncEnvelope event) {
    new TransactionTemplate(manager).executeWithoutResult(tx ->
      receiver().publish(event.eventId(), event.kind(), event.aggregateId(), event.payload()));
  }
  OutboxDispatcher dispatcher() { return new OutboxDispatcher(jdbc, properties, new SyncAuthentication(properties, clock), clock); }
  void listen(boolean timeout) throws Exception {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/internal/events", exchange -> {
      try {
        if (timeout) Thread.sleep(6000);
        var controller = new SyncController(receiver(), new SyncAuthentication(properties, clock), mapper);
        var headers = exchange.getRequestHeaders();
        controller.receive(exchange.getRequestBody().readAllBytes(), headers.getFirst("X-Sync-Source"),
          headers.getFirst("X-Sync-Time"), headers.getFirst("X-Sync-Signature"));
        exchange.sendResponseHeaders(204, -1);
      } catch (Exception ex) { exchange.sendResponseHeaders(503, -1); }
      finally { exchange.close(); }
    });
    server.start();
    properties.getTargets().put("order-service", "http://127.0.0.1:" + server.getAddress().getPort());
  }

  @Test void unavailableServiceRecoversFromPersistedWorkAfterRestart() throws Exception {
    enqueue(event());
    dispatcher().dispatch();
    assertThat(jdbc.queryForObject("SELECT attempts FROM sync_outbox", Integer.class)).isEqualTo(1);
    // New connection pool and workers use only the database, not an in-memory queue.
    jdbc = new JdbcTemplate(new DriverManagerDataSource(database.getUrl(), "sa", ""));
    listen(false);
    clock.advance(30000);
    dispatcher().dispatch();
    assertThat(jdbc.queryForObject("SELECT state FROM sync_outbox", String.class)).isEqualTo("DELIVERED");
    assertThat(jdbc.queryForObject("SELECT status FROM test_orders", String.class)).isEqualTo("SUCCESS");
  }

  @Test void duplicateAcknowledgmentLossCannotRepeatStatusTransition() throws Exception {
    var event = event();
    var bytes = mapper.writeValueAsBytes(event);
    receiver().receive(event, bytes);
    receiver().receive(event, bytes);
    assertThat(jdbc.queryForObject("SELECT changes FROM test_orders", Integer.class)).isEqualTo(1);
    var changed = new SyncEnvelope(event.eventId(), event.source(), event.kind(), event.aggregateId(),
      mapper.valueToTree(Map.of("eventId", event.eventId().toString(), "orderId", "order-1", "status", "FAILED")));
    assertThatThrownBy(() -> receiver().receive(changed, mapper.writeValueAsBytes(changed)))
      .isInstanceOf(ResponseStatusException.class);
  }

  @Test void rollbackDoesNotAcknowledgeOrLoseWork() throws Exception {
    var event = event();
    ((com.fasterxml.jackson.databind.node.ObjectNode) event.payload()).put("status", "INVALID");
    assertThatThrownBy(() -> receiver().receive(event, mapper.writeValueAsBytes(event))).isInstanceOf(IllegalArgumentException.class);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_inbox", Integer.class)).isZero();
    assertThatThrownBy(() -> new TransactionTemplate(manager).executeWithoutResult(tx -> {
      receiver().publish(event.eventId(), "payment", "order-1", event.payload());
      throw new IllegalStateException("Domain rollback");
    })).isInstanceOf(IllegalStateException.class);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox", Integer.class)).isZero();
  }

  @Test void exhaustedWorkIsRetainedAndBlocksFollowingAggregateEvents() throws Exception {
    properties.setMaxAttempts(1);
    enqueue(event());
    enqueue(event());
    dispatcher().dispatch();
    listen(false);
    clock.advance(30000);
    dispatcher().dispatch();
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_inbox", Integer.class)).isZero();
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox WHERE state='DEAD'", Integer.class)).isEqualTo(1);
    jdbc.update("UPDATE sync_outbox SET state='PENDING',attempts=0,next_attempt=0 WHERE state='DEAD'");
    dispatcher().dispatch();
    dispatcher().dispatch();
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox WHERE state='DELIVERED'", Integer.class)).isEqualTo(2);
  }

  @Test void timeoutRemainsPendingForRetry() throws Exception {
    listen(true);
    enqueue(event());
    dispatcher().dispatch();
    assertThat(jdbc.queryForObject("SELECT state FROM sync_outbox", String.class)).isEqualTo("PENDING");
    assertThat(jdbc.queryForObject("SELECT attempts FROM sync_outbox", Integer.class)).isEqualTo(1);
  }

  @Test void signaturesRejectTamperingUnknownSourceAndExpiredRequests() {
    var auth = new SyncAuthentication(properties, clock);
    byte[] body = "payload".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    String timestamp = Long.toString(clock.instant().getEpochSecond());
    String signature = auth.sign("payment-service", timestamp, body);
    assertThat(auth.verify("payment-service", timestamp, signature, body)).isTrue();
    assertThat(auth.verify("payment-service", timestamp, signature, new byte[0])).isFalse();
    assertThat(auth.verify("unknown-service", timestamp, signature, body)).isFalse();
    clock.advance(301000);
    assertThat(auth.verify("payment-service", timestamp, signature, body)).isFalse();
  }

  @Test void publicationOutsideDomainTransactionIsRejected() {
    var event = event();
    assertThatThrownBy(() -> receiver().publish(event.eventId(), "payment", "order-1", event.payload()))
      .isInstanceOf(IllegalStateException.class);
  }

  @Test void readinessRejectsMissingTableAndIncompleteColumns() throws Exception {
    var factory = new org.springframework.beans.factory.support.DefaultListableBeanFactory();
    var environment = new org.springframework.mock.env.MockEnvironment().withProperty("sync.dispatch-enabled", "false");
    var runner = new SyncAutoConfiguration().syncReadiness(jdbc, properties,
        new SyncAuthentication(properties, clock), factory.getBeanProvider(EventHandler.class), environment);
    runner.run(new org.springframework.boot.DefaultApplicationArguments(new String[0]));
    jdbc.execute("DROP TABLE sync_outbox");
    assertThatThrownBy(() -> runner.run(new org.springframework.boot.DefaultApplicationArguments(new String[0]))).isInstanceOf(org.springframework.dao.DataAccessException.class);
    jdbc.execute("CREATE TABLE sync_outbox(id BIGINT PRIMARY KEY)");
    assertThatThrownBy(() -> runner.run(new org.springframework.boot.DefaultApplicationArguments(new String[0]))).isInstanceOf(org.springframework.dao.DataAccessException.class);
  }

  @Test void expiredLeaseRecoversPersistedWork() throws Exception {
    enqueue(event());
    jdbc.update("UPDATE sync_outbox SET lease_token='abandoned',lease_until=?", clock.millis() + 30000);
    listen(false);
    dispatcher().dispatch();
    assertThat(jdbc.queryForObject("SELECT state FROM sync_outbox", String.class)).isEqualTo("PENDING");
    clock.advance(30001);
    dispatcher().dispatch();
    assertThat(jdbc.queryForObject("SELECT state FROM sync_outbox", String.class)).isEqualTo("DELIVERED");
  }

  static class MutableClock extends Clock {
    Instant now = Instant.parse("2026-10-10T00:00:00Z");
    void advance(long millis) { now = now.plusMillis(millis); }
    public ZoneId getZone() { return ZoneOffset.UTC; }
    public Clock withZone(ZoneId zone) { return this; }
    public Instant instant() { return now; }
  }
}
