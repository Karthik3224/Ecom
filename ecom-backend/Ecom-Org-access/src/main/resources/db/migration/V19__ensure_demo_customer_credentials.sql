-- Keep local demo customer credentials predictable for client demos.
-- Password for both sample customers is admin123.
UPDATE app_customers
SET password_hash = '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.',
    enabled = TRUE,
    locked = FALSE,
    email_verified = TRUE
WHERE LOWER(email) IN ('demo.customer@example.com', 'priya.nair@example.com');
