package com.metaarch.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

public class DurableEvents {
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final SyncProperties properties;
  private final TransactionTemplate transactions;
  private final java.util.function.Supplier<List<EventHandler>> handlerProvider;
  private final Clock clock;
  public DurableEvents(JdbcTemplate jdbc, ObjectMapper mapper, SyncProperties properties,
                       PlatformTransactionManager manager, List<EventHandler> handlers, Clock clock) {
    this(jdbc, mapper, properties, manager, () -> handlers, clock);
  }
  public DurableEvents(JdbcTemplate jdbc, ObjectMapper mapper, SyncProperties properties,
                       PlatformTransactionManager manager, java.util.function.Supplier<List<EventHandler>> handlers, Clock clock) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.properties = properties;
    transactions = new TransactionTemplate(manager);
    this.clock = clock;
    this.handlerProvider = handlers;
  }

  public void publish(UUID eventId, String kind, String aggregateId, Object payload) {
    if (!TransactionSynchronizationManager.isActualTransactionActive()) {
      throw new IllegalStateException("Domain changes and outbox records must share a transaction");
    }
    String route = properties.getRoutes().get(kind);
    if (route == null || route.isBlank()) throw new IllegalStateException("Missing sync route: " + kind);
    try {
      String body = mapper.writeValueAsString(new SyncEnvelope(eventId, properties.getService(), kind,
        aggregateId, mapper.valueToTree(payload)));
      for (String target : route.split(",")) {
        target = target.trim();
        if (!properties.getTargets().containsKey(target)) throw new IllegalStateException("Missing sync target: " + target);
        jdbc.update("INSERT INTO sync_outbox(event_id,target,aggregate_id,body,state,attempts,next_attempt) VALUES (?,?,?,?, 'PENDING',0,?)",
          eventId.toString(), target, aggregateId, body, clock.millis());
      }
    } catch (com.fasterxml.jackson.core.JsonProcessingException ex) { throw new IllegalArgumentException("Cannot serialize event", ex); }
  }

  public void receive(SyncEnvelope event, byte[] rawBody) {
    if (event.eventId() == null || event.aggregateId() == null || event.aggregateId().isBlank() || event.payload() == null) {
      throw new ResponseStatusException(BAD_REQUEST, "Invalid event envelope");
    }
    var candidates = handlerProvider.get().stream().filter(h -> h.kind().equals(event.kind())).toList();
    EventHandler handler = candidates.size() == 1 ? candidates.getFirst() : null;
    if (handler == null || !handler.source().equals(event.source())) throw new ResponseStatusException(FORBIDDEN, "Event source is not authorized");
    if (!event.eventId().toString().equals(event.payload().path("eventId").asText())
        || !event.aggregateId().equals(event.payload().path("orderId").asText())) {
      throw new ResponseStatusException(BAD_REQUEST, "Event payload identity mismatch");
    }
    transactions.executeWithoutResult(status -> {
      // A seeded row serializes receiver commits across processes, including first delivery.
      jdbc.queryForObject("SELECT id FROM sync_receiver_lock WHERE id=1 FOR UPDATE", Integer.class);
      var hashes = jdbc.queryForList("SELECT body_hash FROM sync_inbox WHERE source=? AND event_id=?",
        String.class, event.source(), event.eventId().toString());
      String hash = SyncAuthentication.digest(rawBody);
      if (!hashes.isEmpty()) {
        if (!hashes.getFirst().equals(hash)) throw new ResponseStatusException(CONFLICT, "Event identity reused with different content");
        return;
      }
      handler.handle(event.payload());
      jdbc.update("INSERT INTO sync_inbox(source,event_id,body_hash,received_at) VALUES (?,?,?,?)",
        event.source(), event.eventId().toString(), hash, clock.millis());
    });
  }
}
