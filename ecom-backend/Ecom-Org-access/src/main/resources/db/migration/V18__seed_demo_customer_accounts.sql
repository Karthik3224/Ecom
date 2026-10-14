-- Demo customer accounts for local testing.
-- Password for both sample customers is admin123.
INSERT INTO app_customers (id, username, email, mobile, full_name, password_hash, enabled, locked, email_verified)
SELECT UNHEX(REPLACE(UUID(),'-','')),
       'demo.customer@example.com',
       'demo.customer@example.com',
       '+919999999999',
       'Demo Customer',
       '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.',
       TRUE,
       FALSE,
       TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM app_customers WHERE LOWER(email) = 'demo.customer@example.com'
);

INSERT INTO app_customers (id, username, email, mobile, full_name, password_hash, enabled, locked, email_verified)
SELECT UNHEX(REPLACE(UUID(),'-','')),
       'priya.nair@example.com',
       'priya.nair@example.com',
       '+919876543210',
       'Priya Nair',
       '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.',
       TRUE,
       FALSE,
       TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM app_customers WHERE LOWER(email) = 'priya.nair@example.com'
);

INSERT IGNORE INTO app_customer_contacts(contact, customer_user_id)
SELECT CONCAT('email:', LOWER(email)), user_id
FROM app_customers
WHERE LOWER(email) IN ('demo.customer@example.com', 'priya.nair@example.com');

INSERT IGNORE INTO app_customer_contacts(contact, customer_user_id)
SELECT CONCAT('mobile:', REGEXP_REPLACE(mobile, '[^0-9]', '')), user_id
FROM app_customers
WHERE LOWER(email) IN ('demo.customer@example.com', 'priya.nair@example.com')
  AND mobile IS NOT NULL;
