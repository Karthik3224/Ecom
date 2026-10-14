CREATE TABLE sync_receiver_lock (id INT PRIMARY KEY);
INSERT INTO sync_receiver_lock (id) VALUES (1);
CREATE TABLE sync_inbox (
  source VARCHAR(64) NOT NULL,
  event_id VARCHAR(36) NOT NULL,
  body_hash VARCHAR(64) NOT NULL,
  received_at BIGINT NOT NULL,
  PRIMARY KEY (source,event_id)
);
CREATE TABLE sync_outbox (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(36) NOT NULL,
  target VARCHAR(64) NOT NULL,
  aggregate_id VARCHAR(128) NOT NULL,
  body LONGTEXT NOT NULL,
  state VARCHAR(16) NOT NULL,
  attempts INT NOT NULL,
  next_attempt BIGINT NOT NULL,
  lease_token VARCHAR(36),
  lease_until BIGINT,
  last_error VARCHAR(128),
  UNIQUE (event_id,target)
);
CREATE INDEX sync_outbox_due ON sync_outbox(state,next_attempt);
CREATE INDEX sync_outbox_ordering ON sync_outbox(target,aggregate_id,id);
