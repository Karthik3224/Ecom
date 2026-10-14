-- Password for this demo account is admin123.
INSERT INTO app_users (username, email, password_hash, display_name, mobile, status, enabled, locked)
VALUES ('storemanagersrnagar', 'storemanagersrnagar@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', 'Vikram SR Nagar', '+91 90000 32014', 'Active', TRUE, FALSE)
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  display_name = VALUES(display_name),
  mobile = VALUES(mobile),
  status = VALUES(status),
  enabled = VALUES(enabled),
  locked = VALUES(locked);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM app_users u
JOIN roles r ON r.name = 'STORE_MANAGER'
WHERE u.username = 'storemanagersrnagar';

INSERT INTO memberships (
  user_id, role_id, organization_id, location_id, store_id, store_name, store_location, store_address,
  latitude, longitude, provider, location_accuracy_meters, assigned_by
)
SELECT u.id, r.id, 'metaarch-commerce', 'hyderabad', 'india-store-1-3', 'SR Nagar Store',
  'Hyderabad', 'Home, 4-1-209, Floor 2, SR Nagar Main Road, Srinivas Nagar, SR Nagar, Ameerpet, Hyderabad, Telangana 500038, India',
  17.4419210, 78.4482870, 'OPENSTREETMAP', 25.00, 'system-seed'
FROM app_users u
JOIN roles r ON r.name = 'STORE_MANAGER'
WHERE u.username = 'storemanagersrnagar'
  AND NOT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = u.id
      AND m.role_id = r.id
      AND COALESCE(m.store_id, '') = 'india-store-1-3'
  );
