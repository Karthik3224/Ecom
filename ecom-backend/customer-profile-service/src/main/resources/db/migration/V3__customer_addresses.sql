CREATE TABLE IF NOT EXISTS customer_addresses (
 id BINARY(16) NOT NULL, username VARCHAR(191) NOT NULL, type VARCHAR(30) NOT NULL,
 address VARCHAR(1000) NOT NULL, phone VARCHAR(20) NOT NULL, house_number VARCHAR(120) NOT NULL,
 floor VARCHAR(50) NOT NULL, landmark VARCHAR(160) NULL, latitude DOUBLE NULL, longitude DOUBLE NULL,
 street VARCHAR(255) NULL, city VARCHAR(120) NULL, state VARCHAR(120) NULL, pincode VARCHAR(12) NULL,
 default_address BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP(6) NOT NULL, updated_at TIMESTAMP(6) NOT NULL,
 PRIMARY KEY(id), INDEX idx_customer_addresses_username(username)
);
