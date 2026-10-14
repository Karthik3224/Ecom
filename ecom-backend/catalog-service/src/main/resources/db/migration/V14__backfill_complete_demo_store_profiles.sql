INSERT INTO stores(
  id, name, store_code, logo_url, description, location, address, door_number, street_name, area, landmark, city, district, state, pincode,
  latitude, longitude, provider, location_accuracy_meters, phone, alternate_phone, email, admin_name, store_rating, gst_number, status,
  delivery_enabled, pickup_enabled, delivery_radius_km, delivery_eta_minutes, delivery_charge, free_delivery_above, delivery_modes, delivery_notes,
  active, created_at, updated_at
)
VALUES
  ('india-store-1-1', 'Hyderabad Main Store', 'HYD-MAIN-001', 'https://loremflickr.com/900/600/grocery,food,store?lock=900', 'Full-service grocery, pickle and daily essentials hub for Madhapur and nearby Hyderabad customers.', 'Hyderabad', 'Madhapur Main Road, Hyderabad, Telangana 500081, India', 'Plot 18', 'Madhapur Main Road', 'Madhapur', 'Near Metro Pillar 1724', 'Hyderabad', 'Hyderabad', 'Telangana', '500081', 17.4482948, 78.3914850, 'OPENSTREETMAP', 25.00, '+91 91000 20000', '+91 91000 21000', 'hyderabad-main@metaarch.local', 'Ramesh HYD Main', 4.60, '36AABCM1234F1Z1', 'Active', TRUE, TRUE, 10.00, 20, 35.00, 499.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Standard, instant, express, scheduled delivery and store pickup are available by radius.', TRUE, NOW(6), NOW(6)),
  ('india-store-1-3', 'SR Nagar Store', 'HYD-SRN-003', 'https://loremflickr.com/900/600/grocery,store,hyderabad?lock=913', 'Neighborhood grocery and daily essentials store serving SR Nagar, Ameerpet and nearby Hyderabad customers.', 'Hyderabad', 'Home, 4-1-209, Floor 2, SR Nagar Main Road, Srinivas Nagar, SR Nagar, Ameerpet, Hyderabad, Telangana 500038, India', '4-1-209', 'SR Nagar Main Road', 'SR Nagar', 'Near Ameerpet Metro', 'Hyderabad', 'Hyderabad', 'Telangana', '500038', 17.4419210, 78.4482870, 'OPENSTREETMAP', 25.00, '+91 91000 20013', '+91 91000 21013', 'srnagar@metaarch.local', 'Vikram SR Nagar', 4.50, '36AABCM1234F1Z3', 'Active', TRUE, TRUE, 10.00, 20, 30.00, 499.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Delivery settings are seeded for checkout quote testing and can be edited by the store manager.', TRUE, NOW(6), NOW(6)),
  ('store-gachibowli', 'Gachibowli Fresh Hub', 'HYD-GCB-002', 'https://loremflickr.com/900/600/grocery,store,food?lock=901', 'Fresh hub for Gachibowli, Kondapur and DLF Road groceries with pickup and fast delivery.', 'Hyderabad', 'DLF Road, Gachibowli, Hyderabad, Telangana 500032, India', 'Shop 9', 'DLF Road', 'Gachibowli', 'Opposite DLF Cyber City', 'Hyderabad', 'Hyderabad', 'Telangana', '500032', 17.4434778, 78.3771953, 'OPENSTREETMAP', 20.00, '+91 91000 20001', '+91 91000 21001', 'gachibowli@metaarch.local', 'Sravani Gachibowli', 4.70, '36AABCM1234F1Z2', 'Active', TRUE, TRUE, 8.00, 18, 30.00, 399.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Fast grocery delivery and pickup for Gachibowli service zones.', TRUE, NOW(6), NOW(6)),
  ('store-banjara', 'Banjara Hills Pickle House', 'HYD-BNJ-004', 'https://loremflickr.com/900/600/indian,food,shop?lock=902', 'Premium pickle, dry fruit and grocery store for Banjara Hills and Jubilee Hills.', 'Hyderabad', 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034, India', '8-2-293', 'Road No. 12', 'Banjara Hills', 'Near KBR Park', 'Hyderabad', 'Hyderabad', 'Telangana', '500034', 17.4138277, 78.4397573, 'OPENSTREETMAP', 25.00, '+91 91000 20002', '+91 91000 21002', 'banjara@metaarch.local', 'Mahesh Banjara', 4.55, '36AABCM1234F1Z4', 'Active', TRUE, TRUE, 12.00, 25, 40.00, 599.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Premium orders are eligible for express delivery inside the configured radius.', TRUE, NOW(6), NOW(6)),
  ('store-secunderabad', 'Secunderabad Daily Foods', 'HYD-SCB-005', 'https://loremflickr.com/900/600/vegetable,market?lock=903', 'Daily foods and fresh produce store for Secunderabad, Begumpet and nearby customers.', 'Hyderabad', 'Sardar Patel Road, Secunderabad, Telangana 500003, India', 'Door 21', 'Sardar Patel Road', 'Secunderabad', 'Near Paradise Circle', 'Hyderabad', 'Hyderabad', 'Telangana', '500003', 17.4399295, 78.4982741, 'OPENSTREETMAP', 30.00, '+91 91000 20003', '+91 91000 21003', 'secunderabad@metaarch.local', 'Anil Secunderabad', 4.40, '36AABCM1234F1Z5', 'Active', TRUE, FALSE, 6.00, 22, 25.00, 349.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery', 'Pickup is disabled for this sample store; delivery methods remain configurable.', TRUE, NOW(6), NOW(6)),
  ('store-benzcircle', 'Benz Circle Fresh Basket', 'VJA-BNZ-001', 'https://loremflickr.com/900/600/fresh,food?lock=907', 'Fresh basket store for Benz Circle and central Vijayawada groceries.', 'Vijayawada', 'Benz Circle, Vijayawada, Andhra Pradesh 520010, India', 'Shop 5', 'MG Road', 'Benz Circle', 'Near Trendset Mall', 'Vijayawada', 'NTR', 'Andhra Pradesh', '520010', 16.5061743, 80.6480153, 'OPENSTREETMAP', 20.00, '+91 91000 20007', '+91 91000 21007', 'benzcircle@metaarch.local', 'Lakshmi Benz Circle', 4.50, '37AABCM1234F1Z1', 'Active', TRUE, TRUE, 9.00, 20, 35.00, 499.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Central Vijayawada delivery slots and pickup are active.', TRUE, NOW(6), NOW(6)),
  ('store-governorpet', 'Governorpet Spice Store', 'VJA-GOV-002', 'https://loremflickr.com/900/600/spice,store?lock=908', 'Spices, pickles and pantry goods for Governorpet and nearby Vijayawada areas.', 'Vijayawada', 'Governorpet, Vijayawada, Andhra Pradesh 520002, India', '27-14-52', 'Eluru Road', 'Governorpet', 'Near Old Bus Stand', 'Vijayawada', 'NTR', 'Andhra Pradesh', '520002', 16.5131048, 80.6298704, 'OPENSTREETMAP', 30.00, '+91 91000 20008', '+91 91000 21008', 'governorpet@metaarch.local', 'Ravi Governorpet', 4.45, '37AABCM1234F1Z2', 'Active', TRUE, TRUE, 7.00, 24, 30.00, 449.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Governorpet radius pricing is seeded for delivery quote demos.', TRUE, NOW(6), NOW(6)),
  ('store-poranki', 'Poranki Fresh Mart', 'VJA-PRK-003', 'https://loremflickr.com/900/600/grocery,vegetables?lock=909', 'Fresh grocery mart serving Poranki, Kanuru and surrounding Vijayawada neighborhoods.', 'Vijayawada', 'Poranki, Vijayawada, Andhra Pradesh 521137, India', 'D No 3-44', 'Poranki Main Road', 'Poranki', 'Near Kanuru Junction', 'Vijayawada', 'Krishna', 'Andhra Pradesh', '521137', 16.4749723, 80.7125405, 'OPENSTREETMAP', 35.00, '+91 91000 20009', '+91 91000 21009', 'poranki@metaarch.local', 'Sneha Poranki', 4.35, '37AABCM1234F1Z3', 'Active', TRUE, TRUE, 11.00, 28, 45.00, 699.00, 'Standard Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Longer Poranki routes use standard, express and scheduled methods.', TRUE, NOW(6), NOW(6)),
  ('store-tnagar', 'T Nagar Family Foods', 'CHN-TNG-001', 'https://loremflickr.com/900/600/food,market?lock=906', 'Family foods and daily essentials store for T Nagar and central Chennai.', 'Chennai', 'Usman Road, T Nagar, Chennai, Tamil Nadu 600017, India', 'No 41', 'Usman Road', 'T Nagar', 'Near Panagal Park', 'Chennai', 'Chennai', 'Tamil Nadu', '600017', 13.0418068, 80.2341001, 'OPENSTREETMAP', 20.00, '+91 91000 20006', '+91 91000 21006', 'tnagar@metaarch.local', 'Arun T Nagar', 4.55, '33AABCM1234F1Z1', 'Active', TRUE, TRUE, 8.00, 21, 35.00, 499.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Chennai standard and pickup operations are enabled.', TRUE, NOW(6), NOW(6)),
  ('store-adyar', 'Adyar Organic Basket', 'CHN-ADY-002', 'https://loremflickr.com/900/600/organic,food?lock=910', 'Organic grocery and fresh basket store for Adyar and Besant Nagar.', 'Chennai', 'Lattice Bridge Road, Adyar, Chennai, Tamil Nadu 600020, India', 'No 18', 'Lattice Bridge Road', 'Adyar', 'Near Adyar Signal', 'Chennai', 'Chennai', 'Tamil Nadu', '600020', 13.0064500, 80.2577799, 'OPENSTREETMAP', 25.00, '+91 91000 20010', '+91 91000 21010', 'adyar@metaarch.local', 'Divya Adyar', 4.65, '33AABCM1234F1Z2', 'Active', TRUE, TRUE, 10.00, 23, 40.00, 599.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Organic baskets support scheduled delivery and pickup.', TRUE, NOW(6), NOW(6)),
  ('store-velachery', 'Velachery Daily Foods', 'CHN-VLY-003', 'https://loremflickr.com/900/600/supermarket,food?lock=911', 'Daily foods and supermarket items for Velachery and Guindy customers.', 'Chennai', 'Velachery Main Road, Velachery, Chennai, Tamil Nadu 600042, India', 'Plot 62', 'Velachery Main Road', 'Velachery', 'Near Phoenix Marketcity', 'Chennai', 'Chennai', 'Tamil Nadu', '600042', 12.9759710, 80.2212092, 'OPENSTREETMAP', 30.00, '+91 91000 20011', '+91 91000 21011', 'velachery@metaarch.local', 'Karthik Velachery', 4.42, '33AABCM1234F1Z3', 'Active', TRUE, TRUE, 9.00, 26, 38.00, 549.00, 'Standard Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Velachery uses standard, express, scheduled and pickup methods.', TRUE, NOW(6), NOW(6)),
  ('store-koramangala', 'Koramangala Gourmet Mart', 'BLR-KRM-001', 'https://loremflickr.com/900/600/supermarket,food?lock=904', 'Gourmet grocery mart serving Koramangala, HSR Layout and nearby Bengaluru zones.', 'Bengaluru', '5th Block, Koramangala, Bengaluru, Karnataka 560095, India', 'Shop 12', '80 Feet Road', 'Koramangala 5th Block', 'Near Forum Mall', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560095', 12.9352403, 77.6245320, 'OPENSTREETMAP', 20.00, '+91 91000 20004', '+91 91000 21004', 'koramangala@metaarch.local', 'Kiran Koramangala', 4.68, '29AABCM1234F1Z1', 'Active', TRUE, TRUE, 12.00, 19, 30.00, 399.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Gourmet store supports all seeded delivery methods.', TRUE, NOW(6), NOW(6)),
  ('store-indiranagar', 'Indiranagar Organic Foods', 'BLR-IND-002', 'https://loremflickr.com/900/600/organic,vegetables?lock=905', 'Organic foods store serving Indiranagar, Domlur and nearby Bengaluru areas.', 'Bengaluru', '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India', 'No 101', '100 Feet Road', 'Indiranagar', 'Near CMH Road Metro', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560038', 12.9783717, 77.6408356, 'OPENSTREETMAP', 20.00, '+91 91000 20005', '+91 91000 21005', 'indiranagar@metaarch.local', 'Neha Indiranagar', 4.58, '29AABCM1234F1Z2', 'Active', TRUE, TRUE, 7.00, 22, 35.00, 499.00, 'Standard Delivery,Instant Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Organic deliveries and pickup are active inside radius.', TRUE, NOW(6), NOW(6)),
  ('store-whitefield', 'Whitefield Fresh Basket', 'BLR-WTF-003', 'https://loremflickr.com/900/600/fresh,grocery?lock=912', 'Fresh basket and daily grocery store for Whitefield and ITPL customers.', 'Bengaluru', 'Whitefield Main Road, Whitefield, Bengaluru, Karnataka 560066, India', 'Unit 7', 'Whitefield Main Road', 'Whitefield', 'Near ITPL Main Gate', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560066', 12.9698196, 77.7499721, 'OPENSTREETMAP', 30.00, '+91 91000 20012', '+91 91000 21012', 'whitefield@metaarch.local', 'Manoj Whitefield', 4.48, '29AABCM1234F1Z3', 'Active', TRUE, TRUE, 11.00, 27, 42.00, 649.00, 'Standard Delivery,Express Delivery,Scheduled Delivery,Store Pickup', 'Whitefield delivery rules are seeded for longer service areas.', TRUE, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
  store_code = VALUES(store_code),
  logo_url = VALUES(logo_url),
  description = VALUES(description),
  location = VALUES(location),
  address = VALUES(address),
  door_number = VALUES(door_number),
  street_name = VALUES(street_name),
  area = VALUES(area),
  landmark = VALUES(landmark),
  city = VALUES(city),
  district = VALUES(district),
  state = VALUES(state),
  pincode = VALUES(pincode),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  provider = VALUES(provider),
  location_accuracy_meters = VALUES(location_accuracy_meters),
  phone = VALUES(phone),
  alternate_phone = VALUES(alternate_phone),
  email = VALUES(email),
  admin_name = VALUES(admin_name),
  store_rating = VALUES(store_rating),
  gst_number = VALUES(gst_number),
  status = VALUES(status),
  delivery_enabled = VALUES(delivery_enabled),
  pickup_enabled = VALUES(pickup_enabled),
  delivery_radius_km = VALUES(delivery_radius_km),
  delivery_eta_minutes = VALUES(delivery_eta_minutes),
  delivery_charge = VALUES(delivery_charge),
  free_delivery_above = VALUES(free_delivery_above),
  delivery_modes = VALUES(delivery_modes),
  delivery_notes = VALUES(delivery_notes),
  active = VALUES(active),
  updated_at = NOW(6);

INSERT INTO store_managers(store_id, name, email, mobile, status, created_at, updated_at)
SELECT s.id, s.admin_name, s.email, s.phone, 'Active', NOW(6), NOW(6)
FROM stores s
WHERE NOT EXISTS (SELECT 1 FROM store_managers sm WHERE sm.store_id = s.id);

INSERT INTO store_delivery_zones(store_id, min_radius_km, max_radius_km, estimated_delivery_min, estimated_delivery_max, delivery_charge, free_delivery_above, minimum_order, status, created_at, updated_at)
SELECT s.id, 0.00, COALESCE(s.delivery_radius_km, 10.00), GREATEST(COALESCE(s.delivery_eta_minutes, 20) - 5, 5), COALESCE(s.delivery_eta_minutes, 20) + 10, COALESCE(s.delivery_charge, 35.00), COALESCE(s.free_delivery_above, 499.00), 99.00, 'Active', NOW(6), NOW(6)
FROM stores s
WHERE NOT EXISTS (SELECT 1 FROM store_delivery_zones z WHERE z.store_id = s.id);

UPDATE store_delivery_zones z
JOIN stores s ON s.id = z.store_id
SET
  z.max_radius_km = COALESCE(z.max_radius_km, s.delivery_radius_km, 10.00),
  z.estimated_delivery_min = COALESCE(z.estimated_delivery_min, GREATEST(COALESCE(s.delivery_eta_minutes, 20) - 5, 5)),
  z.estimated_delivery_max = COALESCE(z.estimated_delivery_max, COALESCE(s.delivery_eta_minutes, 20) + 10),
  z.delivery_charge = COALESCE(z.delivery_charge, s.delivery_charge, 35.00),
  z.free_delivery_above = COALESCE(z.free_delivery_above, s.free_delivery_above, 499.00),
  z.minimum_order = COALESCE(z.minimum_order, 99.00),
  z.status = COALESCE(z.status, 'Active'),
  z.updated_at = NOW(6);

INSERT INTO store_delivery_methods(store_id, delivery_zone_id, delivery_type, enabled, delivery_charge, estimated_time, settings_configuration, created_at, updated_at)
SELECT z.store_id, z.id, method.delivery_type, TRUE,
  CASE method.delivery_type
    WHEN 'Instant Delivery' THEN z.delivery_charge + 25.00
    WHEN 'Express Delivery' THEN z.delivery_charge + 15.00
    WHEN 'Store Pickup' THEN 0.00
    ELSE z.delivery_charge
  END,
  CASE method.delivery_type
    WHEN 'Instant Delivery' THEN CONCAT(z.estimated_delivery_min, ' min')
    WHEN 'Express Delivery' THEN CONCAT(z.estimated_delivery_min, '-', GREATEST(z.estimated_delivery_min, z.estimated_delivery_max - 10), ' min')
    WHEN 'Scheduled Delivery' THEN 'Customer selected slot'
    WHEN 'Store Pickup' THEN 'Ready in 30 min'
    ELSE CONCAT(z.estimated_delivery_min, '-', z.estimated_delivery_max, ' min')
  END,
  CASE method.delivery_type
    WHEN 'Scheduled Delivery' THEN '{"slots":["09:00-12:00","12:00-16:00","16:00-20:00"]}'
    WHEN 'Store Pickup' THEN '{"pickupInstructions":"Collect from billing counter"}'
    ELSE '{}'
  END,
  NOW(6), NOW(6)
FROM store_delivery_zones z
JOIN (
  SELECT 'Standard Delivery' AS delivery_type UNION ALL
  SELECT 'Instant Delivery' UNION ALL
  SELECT 'Express Delivery' UNION ALL
  SELECT 'Scheduled Delivery' UNION ALL
  SELECT 'Store Pickup'
) method
WHERE NOT EXISTS (
  SELECT 1 FROM store_delivery_methods existing
  WHERE existing.delivery_zone_id = z.id AND existing.delivery_type = method.delivery_type
);
