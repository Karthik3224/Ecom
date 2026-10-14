package com.metaarch.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.util.List;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.PlatformTransactionManager;

@AutoConfiguration
@EnableConfigurationProperties(SyncProperties.class)
@EnableScheduling
public class SyncAutoConfiguration {
  @Bean SyncAuthentication syncAuthentication(SyncProperties p) { return new SyncAuthentication(p, Clock.systemUTC()); }
  @Bean DurableEvents durableEvents(JdbcTemplate jdbc, ObjectMapper mapper, SyncProperties p,
      PlatformTransactionManager manager, org.springframework.beans.factory.ObjectProvider<EventHandler> handlers) {
    return new DurableEvents(jdbc, mapper, p, manager, () -> handlers.orderedStream().toList(), Clock.systemUTC());
  }
  @Bean SyncController syncController(DurableEvents events, SyncAuthentication auth, ObjectMapper mapper) {
    return new SyncController(events, auth, mapper);
  }
  @Bean
  org.springframework.boot.ApplicationRunner syncReadiness(JdbcTemplate jdbc, SyncProperties p,
      SyncAuthentication auth, org.springframework.beans.factory.ObjectProvider<EventHandler> handlers,
      org.springframework.core.env.Environment environment) {
    return args -> {
      if (jdbc.queryForObject("SELECT COUNT(*) FROM sync_receiver_lock WHERE id=1", Integer.class) != 1) {
        throw new IllegalStateException("HTTP sync schema must be provisioned before startup");
      }
      jdbc.queryForObject("SELECT COUNT(*) FROM sync_inbox", Long.class);
      jdbc.queryForObject("SELECT COUNT(*) FROM sync_outbox", Long.class);
      jdbc.queryForList("SELECT source,event_id,body_hash,received_at FROM sync_inbox WHERE 1=0");
      jdbc.queryForList("SELECT id,event_id,target,aggregate_id,body,state,attempts,next_attempt,lease_token,lease_until,last_error FROM sync_outbox WHERE 1=0");
      if (environment.getProperty("sync.dispatch-enabled", Boolean.class, true)) {
        var sources = new java.util.HashSet<String>();
        handlers.orderedStream().forEach(handler -> sources.add(handler.source()));
        if (!"notification-service".equals(p.getService())) sources.add(p.getService());
        for (String source : sources) auth.sign(source, "0", new byte[0]);
      }
    };
  }
  @Bean
  @ConditionalOnProperty(name="sync.dispatch-enabled", havingValue="true", matchIfMissing=true)
  OutboxDispatcher outboxDispatcher(JdbcTemplate jdbc, SyncProperties p, SyncAuthentication auth) {
    return new OutboxDispatcher(jdbc, p, auth, Clock.systemUTC());
  }
}
