CREATE TABLE IF NOT EXISTS cart_write_lock (id INT PRIMARY KEY);
MERGE INTO cart_write_lock KEY(id) VALUES(1);
CREATE TABLE IF NOT EXISTS cart_mutation_requests (cart_id VARCHAR(36), request_key VARCHAR(128), request_hash VARCHAR(64), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(cart_id,request_key));
CREATE TABLE IF NOT EXISTS cart_checkout_claims (cart_id VARCHAR(36) PRIMARY KEY, request_hash VARCHAR(64), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
