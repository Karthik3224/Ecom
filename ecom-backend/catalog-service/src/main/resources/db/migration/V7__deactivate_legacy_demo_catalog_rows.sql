UPDATE products p
JOIN categories c ON c.id = p.category_id
SET p.status = 'INACTIVE',
    p.updated_at = NOW(6)
WHERE p.sku LIKE 'THEJO-%'
   OR p.sku = 'Almonds'
   OR p.slug IN ('avakaya-pickle', 'lemon-pickle', 'gongura-pickle', 'garlic-pickle', 'red-chilli-powder', 'turmeric-powder', 'garam-masala', 'whole-clove', 'premium-jumbo-cashews', 'california-almonds', 'vineeth')
   OR c.slug IN ('pickles', 'spice-powder', 'whole-masala', 'dry-fruits', 'dry-fruits1');

UPDATE categories
SET active = FALSE,
    updated_at = NOW(6)
WHERE slug IN ('pickles', 'spice-powder', 'whole-masala', 'dry-fruits', 'dry-fruits1', 'home-spices')
  AND slug NOT IN ('traditional-pickles', 'premium-dry-fruits', 'fresh-vegetables', 'fresh-non-veg');
