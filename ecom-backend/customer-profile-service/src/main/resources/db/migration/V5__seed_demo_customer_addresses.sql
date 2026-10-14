INSERT INTO customer_addresses(id, username, type, address, phone, house_number, floor, landmark, latitude, longitude, street, city, state, pincode, default_address, created_at, updated_at)
SELECT UUID_TO_BIN('63000000-0000-0000-0000-000000000001'),
       'demo.customer@example.com',
       'HOME',
       'Plot 24, Gachibowli Circle, Hyderabad, Telangana, India',
       '+919999999999',
       '24',
       '2nd Floor',
       'Near Gachibowli Circle',
       17.4401,
       78.3489,
       'Gachibowli Main Road',
       'Hyderabad',
       'Telangana',
       '500032',
       TRUE,
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM customer_addresses WHERE id = UUID_TO_BIN('63000000-0000-0000-0000-000000000001'));

INSERT INTO customer_addresses(id, username, type, address, phone, house_number, floor, landmark, latitude, longitude, street, city, state, pincode, default_address, created_at, updated_at)
SELECT UUID_TO_BIN('63000000-0000-0000-0000-000000000002'),
       'priya.nair@example.com',
       'HOME',
       'Villa 8, Kondapur, Hyderabad, Telangana, India',
       '+919876543210',
       '8',
       'Ground Floor',
       'Near Kondapur Bus Stop',
       17.4570,
       78.3311,
       'Kondapur Main Road',
       'Hyderabad',
       'Telangana',
       '500084',
       TRUE,
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM customer_addresses WHERE id = UUID_TO_BIN('63000000-0000-0000-0000-000000000002'));
