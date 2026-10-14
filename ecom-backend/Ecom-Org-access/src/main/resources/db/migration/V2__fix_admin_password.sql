-- Development bootstrap account documented in the API Gateway guide.
-- Replace or disable this account before deploying to a shared environment.
UPDATE app_users
SET password_hash = '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'
WHERE username = 'admin';
