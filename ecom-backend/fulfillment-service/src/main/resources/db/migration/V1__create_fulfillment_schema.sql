CREATE TABLE fulfillment_order_snapshots (
  order_id BINARY(16) NOT NULL PRIMARY KEY,
  customer_id BINARY(16) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  shipping_address_id BINARY(16),
  fulfillment_type VARCHAR(30) NOT NULL,
  cancelled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  INDEX idx_fulfillment_order_snapshots_customer (customer_id),
  INDEX idx_fulfillment_order_snapshots_store (store_id)
);

CREATE TABLE fulfillments (
  id BINARY(16) NOT NULL PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  customer_id BINARY(16) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL,
  fulfillment_type VARCHAR(30) NOT NULL,
  shipping_address_id BINARY(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_fulfillments_order UNIQUE (order_id),
  INDEX idx_fulfillments_customer_created (customer_id, created_at),
  INDEX idx_fulfillments_store_status (store_id, status),
  INDEX idx_fulfillments_status_created (status, created_at)
);

CREATE TABLE shipments (
  id BINARY(16) NOT NULL PRIMARY KEY,
  fulfillment_id BINARY(16) NOT NULL,
  order_id BINARY(16) NOT NULL,
  carrier VARCHAR(80) NOT NULL,
  tracking_number VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL,
  shipped_at TIMESTAMP(6),
  delivered_at TIMESTAMP(6),
  estimated_delivery_date DATE NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_shipments_fulfillment FOREIGN KEY (fulfillment_id) REFERENCES fulfillments(id),
  CONSTRAINT uk_shipments_tracking_number UNIQUE (tracking_number),
  INDEX idx_shipments_order (order_id),
  INDEX idx_shipments_fulfillment (fulfillment_id),
  INDEX idx_shipments_status_created (status, created_at)
);

CREATE TABLE tracking_events (
  id BINARY(16) NOT NULL PRIMARY KEY,
  shipment_id BINARY(16) NOT NULL,
  status VARCHAR(30) NOT NULL,
  location VARCHAR(160) NOT NULL,
  description VARCHAR(500) NOT NULL,
  event_time TIMESTAMP(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_tracking_events_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  INDEX idx_tracking_events_shipment_time (shipment_id, event_time),
  INDEX idx_tracking_events_status_time (status, event_time)
);
