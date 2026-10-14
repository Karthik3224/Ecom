CREATE TABLE app_customers (
 user_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 id BINARY(16) NOT NULL UNIQUE,
 username VARCHAR(190) NOT NULL UNIQUE,
 email VARCHAR(255) NOT NULL UNIQUE,
 mobile VARCHAR(30),
 full_name VARCHAR(120) NOT NULL,
 password_hash VARCHAR(255),
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 locked BOOLEAN NOT NULL DEFAULT FALSE,
 email_verified BOOLEAN NOT NULL DEFAULT TRUE,
 token_version BIGINT NOT NULL DEFAULT 0,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);
INSERT INTO app_customers(user_id,id,username,email,mobile,full_name,password_hash,enabled,locked,email_verified,token_version)
 SELECT u.id,c.id,u.username,u.email,u.mobile,c.full_name,u.password_hash,u.enabled,u.locked,u.email_verified,u.token_version
 FROM users u JOIN customers c ON c.user_id=u.id;
-- Preserve legacy rows and their incoming FKs. Staff-facing compatibility projection
-- excludes customers; all new customer writes go exclusively to app_customers.
CREATE OR REPLACE VIEW app_users AS SELECT u.* FROM users u
 WHERE NOT EXISTS (SELECT 1 FROM app_customers c WHERE c.username=u.username);
CREATE TABLE app_customer_otp LIKE customer_otp;
INSERT INTO app_customer_otp SELECT * FROM customer_otp;
CREATE TABLE app_customer_contacts (
 contact VARCHAR(320) PRIMARY KEY,
 customer_user_id BIGINT NOT NULL,
 FOREIGN KEY(customer_user_id) REFERENCES app_customers(user_id)
);
INSERT IGNORE INTO app_customer_contacts SELECT CONCAT('email:',LOWER(email)),user_id FROM app_customers;
INSERT IGNORE INTO app_customer_contacts SELECT CONCAT('mobile:',REGEXP_REPLACE(mobile,'[^0-9]','')),user_id FROM app_customers WHERE mobile IS NOT NULL;
