export const catalog = new Map([
  ['seed-avakaya-pickle', 199],
  ['seed-lemon-pickle', 189],
  ['seed-gongura-pickle', 199],
  ['seed-garlic-pickle', 209],
  ['seed-red-chilli-powder', 120],
  ['seed-turmeric-powder', 89],
  ['seed-garam-masala', 110],
  ['seed-whole-clove-laung-', 149],
  ['seed-premium-jumbo-cashews', 349],
  ['seed-california-almonds-badam-', 450],
]);

export const calculateOrderAmount = ({ items, checkout = {} }) => {
  if (!Array.isArray(items) || items.length === 0) throw new Error('The order has no products.');
  const subtotal = items.reduce((sum, item) => {
    const price = catalog.get(item.id);
    const quantity = Number(item.quantity);
    if (price == null) throw new Error(`Product ${item.id || 'unknown'} is not available in the payment catalog.`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error('Invalid product quantity.');
    return sum + price * quantity;
  }, 0);
  const deliveryFee = checkout.method === 'express' ? 49 : checkout.method === 'instant' ? 29 : 0;
  const handlingFee = 5;
  const discount = checkout.coupon === 'SAVE10' ? Math.round(subtotal * 0.1) : 0;
  return { subtotal, deliveryFee, handlingFee, discount, total:subtotal + deliveryFee + handlingFee - discount };
};
