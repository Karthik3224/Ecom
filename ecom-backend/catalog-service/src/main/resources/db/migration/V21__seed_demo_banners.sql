INSERT INTO banners (id, title, description, image_url, mobile_image_url, target_url, scope, sort_order, status, created_at, updated_at)
VALUES
  (UUID_TO_BIN(UUID()), 'Fresh Pickles Sale',
   'Up to 20% off on hand-crafted pickles this week.',
   'https://loremflickr.com/1200/400/pickle,food?lock=2001',
   'https://loremflickr.com/720/540/pickle,food?lock=2001',
   '/home', 'GLOBAL', 1, 'ACTIVE', NOW(6), NOW(6)),
  (UUID_TO_BIN(UUID()), 'Free Delivery Above 499',
   'Order groceries and spices with free delivery over Rs. 499.',
   'https://loremflickr.com/1200/400/spices,market?lock=2002',
   'https://loremflickr.com/720/540/spices,market?lock=2002',
   '/home', 'GLOBAL', 2, 'ACTIVE', NOW(6), NOW(6));
