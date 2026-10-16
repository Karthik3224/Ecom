package com.metaarch.sync;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;

public class OutboxDispatcher {
  private final JdbcTemplate jdbc;
  private final SyncProperties properties;
  private final SyncAuthentication authentication;
  private final Clock clock;
  private final HttpClient client;
  public OutboxDispatcher(JdbcTemplate jdbc, SyncProperties properties, SyncAuthentication authentication, Clock clock) {
    this.jdbc = jdbc; this.properties = properties; this.authentication = authentication; this.clock = clock;
    client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();
  }
  @Scheduled(fixedDelayString = "${sync.poll-ms:2000}")
  public void dispatch() {
    var candidates = jdbc.queryForList("SELECT o.id FROM sync_outbox o WHERE o.state='PENDING' AND o.next_attempt<=? AND (o.lease_until IS NULL OR o.lease_until<=?) AND NOT EXISTS (SELECT 1 FROM sync_outbox p WHERE p.target=o.target AND p.aggregate_id=o.aggregate_id AND p.id<o.id AND p.state<>'DELIVERED') ORDER BY o.id LIMIT 20",
      Long.class, clock.millis(), clock.millis());
    for (long id : candidates) deliver(id);
  }
  private void deliver(long id) {
    String lease = UUID.randomUUID().toString();
    if (jdbc.update("UPDATE sync_outbox SET lease_token=?, lease_until=? WHERE id=? AND state='PENDING' AND next_attempt<=? AND (lease_until IS NULL OR lease_until<=?)",
        lease, clock.millis() + 30000, id, clock.millis(), clock.millis()) != 1) return;
    var row = jdbc.queryForMap("SELECT target,body,attempts FROM sync_outbox WHERE id=?", id);
    int attempt = ((Number) row.get("attempts")).intValue() + 1;
    try {
      String destination = properties.getTargets().get(row.get("target").toString());
      if (destination == null) throw new IllegalStateException("Missing target");
      URI uri = URI.create(destination + "/internal/events");
      if (!"http".equals(uri.getScheme()) && !"https".equals(uri.getScheme())) throw new IllegalStateException("Invalid target scheme");
      if ("http".equals(uri.getScheme()) && !java.util.Set.of("localhost", "127.0.0.1", "[::1]").contains(uri.getHost())) {
        throw new IllegalStateException("Non-loopback synchronization requires HTTPS");
      }
      byte[] body = row.get("body").toString().getBytes(StandardCharsets.UTF_8);
      String timestamp = Long.toString(clock.instant().getEpochSecond());
      var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5))
        .header("Content-Type", "application/json").header("X-Sync-Source", properties.getService())
        .header("X-Sync-Time", timestamp).header("X-Sync-Signature", authentication.sign(properties.getService(), timestamp, body))
        .POST(HttpRequest.BodyPublishers.ofByteArray(body)).build();
      int status = client.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
      if (status != 204) throw new IllegalStateException("HTTP " + status);
      jdbc.update("UPDATE sync_outbox SET state='DELIVERED',attempts=?,lease_token=NULL,lease_until=NULL,last_error=NULL WHERE id=? AND lease_token=?",
        attempt, id, lease);
    } catch (Exception ex) {
      if (ex instanceof InterruptedException) Thread.currentThread().interrupt();
      String state = attempt >= properties.getMaxAttempts() ? "DEAD" : "PENDING";
      long delay = Math.min(300000L, 1000L << Math.min(attempt, 18));
      jdbc.update("UPDATE sync_outbox SET state=?,attempts=?,next_attempt=?,lease_token=NULL,lease_until=NULL,last_error=? WHERE id=? AND lease_token=?",
        state, attempt, clock.millis() + delay, ex.getClass().getSimpleName(), id, lease);
      LoggerFactory.getLogger(getClass()).warn(
        "Sync delivery id={} target={} attempt={} state={} error={}",
        id, row.get("target"), attempt, state, ex.toString());
    }
  }
}
