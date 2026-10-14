-- Password for every delivery partner seeded here is admin123.
CREATE TEMPORARY TABLE seed_delivery_partner_stores (
  store_index INT NOT NULL,
  partner_prefix VARCHAR(80) NOT NULL,
  location_id VARCHAR(100) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  store_name VARCHAR(180) NOT NULL,
  store_location VARCHAR(160) NOT NULL,
  store_address VARCHAR(700) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  location_accuracy_meters DOUBLE NOT NULL,
  vehicle_state VARCHAR(2) NOT NULL
);

INSERT INTO seed_delivery_partner_stores (
  store_index, partner_prefix, location_id, store_id, store_name, store_location, store_address,
  latitude, longitude, location_accuracy_meters, vehicle_state
)
SELECT 1, 'hydmain', 'hyderabad', 'india-store-1-1', 'Hyderabad Main Store', 'Hyderabad', 'Madhapur Main Road, Hyderabad, Telangana 500081, India', 17.4482948, 78.3914850, 25.00, 'TS' UNION ALL
SELECT 2, 'srnagar', 'hyderabad', 'india-store-1-3', 'SR Nagar Store', 'Hyderabad', 'Home, 4-1-209, Floor 2, SR Nagar Main Road, Srinivas Nagar, SR Nagar, Ameerpet, Hyderabad, Telangana 500038, India', 17.4419210, 78.4482870, 25.00, 'TS' UNION ALL
SELECT 3, 'gachibowli', 'hyderabad', 'store-gachibowli', 'Gachibowli Fresh Hub', 'Hyderabad', 'DLF Road, Gachibowli, Hyderabad, Telangana 500032, India', 17.4434778, 78.3771953, 20.00, 'TS' UNION ALL
SELECT 4, 'banjara', 'hyderabad', 'store-banjara', 'Banjara Hills Pickle House', 'Hyderabad', 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034, India', 17.4138277, 78.4397573, 25.00, 'TS' UNION ALL
SELECT 5, 'secunderabad', 'hyderabad', 'store-secunderabad', 'Secunderabad Daily Foods', 'Hyderabad', 'Sardar Patel Road, Secunderabad, Telangana 500003, India', 17.4399295, 78.4982741, 30.00, 'TS' UNION ALL
SELECT 6, 'benzcircle', 'vijayawada', 'store-benzcircle', 'Benz Circle Fresh Basket', 'Vijayawada', 'Benz Circle, Vijayawada, Andhra Pradesh 520010, India', 16.5061743, 80.6480153, 20.00, 'AP' UNION ALL
SELECT 7, 'governorpet', 'vijayawada', 'store-governorpet', 'Governorpet Spice Store', 'Vijayawada', 'Governorpet, Vijayawada, Andhra Pradesh 520002, India', 16.5131048, 80.6298704, 30.00, 'AP' UNION ALL
SELECT 8, 'poranki', 'vijayawada', 'store-poranki', 'Poranki Fresh Mart', 'Vijayawada', 'Poranki, Vijayawada, Andhra Pradesh 521137, India', 16.4749723, 80.7125405, 35.00, 'AP' UNION ALL
SELECT 9, 'tnagar', 'chennai', 'store-tnagar', 'T Nagar Family Foods', 'Chennai', 'Usman Road, T Nagar, Chennai, Tamil Nadu 600017, India', 13.0418068, 80.2341001, 20.00, 'TN' UNION ALL
SELECT 10, 'adyar', 'chennai', 'store-adyar', 'Adyar Organic Basket', 'Chennai', 'Lattice Bridge Road, Adyar, Chennai, Tamil Nadu 600020, India', 13.0064500, 80.2577799, 25.00, 'TN' UNION ALL
SELECT 11, 'velachery', 'chennai', 'store-velachery', 'Velachery Daily Foods', 'Chennai', 'Velachery Main Road, Velachery, Chennai, Tamil Nadu 600042, India', 12.9759710, 80.2212092, 30.00, 'TN' UNION ALL
SELECT 12, 'koramangala', 'bengaluru', 'store-koramangala', 'Koramangala Gourmet Mart', 'Bengaluru', '5th Block, Koramangala, Bengaluru, Karnataka 560095, India', 12.9352403, 77.6245320, 20.00, 'KA' UNION ALL
SELECT 13, 'indiranagar', 'bengaluru', 'store-indiranagar', 'Indiranagar Organic Foods', 'Bengaluru', '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India', 12.9783717, 77.6408356, 20.00, 'KA' UNION ALL
SELECT 14, 'whitefield', 'bengaluru', 'store-whitefield', 'Whitefield Fresh Basket', 'Bengaluru', 'Whitefield Main Road, Whitefield, Bengaluru, Karnataka 560066, India', 12.9698196, 77.7499721, 30.00, 'KA';

CREATE TEMPORARY TABLE seed_delivery_partner_numbers (
  partner_no INT NOT NULL,
  partner_name VARCHAR(80) NOT NULL,
  vehicle_type VARCHAR(40) NOT NULL
);

INSERT INTO seed_delivery_partner_numbers (partner_no, partner_name, vehicle_type)
SELECT 1, 'Amit Kumar', 'Bike' UNION ALL
SELECT 2, 'Ravi Singh', 'Scooter' UNION ALL
SELECT 3, 'Imran Khan', 'Electric Bike' UNION ALL
SELECT 4, 'Suresh Babu', 'Bike' UNION ALL
SELECT 5, 'Naveen Rao', 'Van';

INSERT INTO app_users (username, email, password_hash, display_name, mobile, status, enabled, locked)
SELECT
  CONCAT('deliverypartner', s.partner_prefix, LPAD(n.partner_no, 2, '0')),
  CONCAT('deliverypartner', s.partner_prefix, LPAD(n.partner_no, 2, '0'), '@metaarch.local'),
  '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.',
  CONCAT(n.partner_name, ' - ', s.store_name),
  CONCAT('+91 90000 ', LPAD(33000 + (s.store_index * 10) + n.partner_no, 5, '0')),
  'Active',
  TRUE,
  FALSE
FROM seed_delivery_partner_stores s
CROSS JOIN seed_delivery_partner_numbers n
WHERE 1 = 1
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
FROM seed_delivery_partner_stores s
CROSS JOIN seed_delivery_partner_numbers n
JOIN app_users u ON u.username = CONCAT('deliverypartner', s.partner_prefix, LPAD(n.partner_no, 2, '0'))
JOIN roles r ON r.name = 'DELIVERY_PARTNER';

INSERT INTO memberships (
  user_id, role_id, organization_id, location_id, store_id, store_name, store_location, store_address,
  latitude, longitude, provider, location_accuracy_meters, assigned_by
)
SELECT
  u.id,
  r.id,
  'metaarch-commerce',
  s.location_id,
  s.store_id,
  s.store_name,
  s.store_location,
  s.store_address,
  s.latitude,
  s.longitude,
  'OPENSTREETMAP',
  s.location_accuracy_meters,
  'system-seed'
FROM seed_delivery_partner_stores s
CROSS JOIN seed_delivery_partner_numbers n
JOIN app_users u ON u.username = CONCAT('deliverypartner', s.partner_prefix, LPAD(n.partner_no, 2, '0'))
JOIN roles r ON r.name = 'DELIVERY_PARTNER'
WHERE NOT EXISTS (
  SELECT 1 FROM memberships m
  WHERE m.user_id = u.id
    AND m.role_id = r.id
    AND COALESCE(m.organization_id, '') = 'metaarch-commerce'
    AND COALESCE(m.location_id, '') = s.location_id
    AND COALESCE(m.store_id, '') = s.store_id
);

DROP TEMPORARY TABLE seed_delivery_partner_numbers;
DROP TEMPORARY TABLE seed_delivery_partner_stores;
