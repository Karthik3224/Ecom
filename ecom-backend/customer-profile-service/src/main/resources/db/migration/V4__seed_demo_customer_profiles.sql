INSERT INTO customer_profiles(id, username, name, phone, email, gender, date_of_birth, photo, created_at, updated_at)
SELECT UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       'demo.customer@example.com',
       'Demo Customer',
       '+919999999999',
       'demo.customer@example.com',
       'MALE',
       '1994-07-18',
       NULL,
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM customer_profiles WHERE username = 'demo.customer@example.com');

INSERT INTO customer_profiles(id, username, name, phone, email, gender, date_of_birth, photo, created_at, updated_at)
SELECT UUID_TO_BIN('60000000-0000-0000-0000-000000000002'),
       'priya.nair@example.com',
       'Priya Nair',
       '+919876543210',
       'priya.nair@example.com',
       'FEMALE',
       '1991-02-11',
       NULL,
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM customer_profiles WHERE username = 'priya.nair@example.com');
