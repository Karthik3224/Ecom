-- Rename preserves primary keys and MySQL updates incoming FK targets atomically.
RENAME TABLE app_users TO users;
-- Compatibility for older operational scripts during rollout; no copied authentication data.
CREATE VIEW app_users AS SELECT * FROM users;
ALTER TABLE users
 ADD COLUMN created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 ADD COLUMN updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE,
 ADD COLUMN token_version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE customers (
 id BINARY(16) NOT NULL PRIMARY KEY,
 user_id BIGINT NOT NULL UNIQUE,
 full_name VARCHAR(120) NOT NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Contact claims enforce uniqueness for new registrations without deleting or changing
-- legacy duplicate mobile numbers. Ambiguous legacy numbers cannot use mobile login.
CREATE TABLE customer_contact_claims (
 contact VARCHAR(320) NOT NULL PRIMARY KEY,
 user_id BIGINT NOT NULL,
 FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO customer_contact_claims(contact,user_id)
 SELECT CONCAT('email:',LOWER(TRIM(email))),MIN(id) FROM users GROUP BY CONCAT('email:',LOWER(TRIM(email)));
INSERT INTO customer_contact_claims(contact,user_id)
 SELECT CONCAT('mobile:',REGEXP_REPLACE(mobile,'[^0-9]','')),MIN(id)
 FROM users WHERE mobile IS NOT NULL AND TRIM(mobile)<>'' GROUP BY CONCAT('mobile:',REGEXP_REPLACE(mobile,'[^0-9]',''));

CREATE TABLE customer_otp (
 id CHAR(36) PRIMARY KEY,
 user_id BIGINT NOT NULL,
 purpose VARCHAR(20) NOT NULL,
 code_hash VARCHAR(255) NOT NULL,
 expires_at TIMESTAMP(6) NOT NULL,
 sent_at TIMESTAMP(6) NOT NULL,
 attempts INT NOT NULL DEFAULT 0,
 consumed BOOLEAN NOT NULL DEFAULT FALSE,
 reset_hash VARCHAR(255),
 reset_expires_at TIMESTAMP(6),
 FOREIGN KEY (user_id) REFERENCES users(id),
 INDEX idx_otp_user_purpose(user_id,purpose,sent_at)
);
CREATE TABLE auth_rate_limits (
 rate_key VARCHAR(255) PRIMARY KEY,
 window_start TIMESTAMP(6) NOT NULL,
 attempts INT NOT NULL
);
CREATE TABLE revoked_tokens (
 token_hash CHAR(64) PRIMARY KEY,
 expires_at TIMESTAMP(6) NOT NULL
);
