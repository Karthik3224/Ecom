const cents = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('Invalid demo checkout amount.');
  return Math.round(number * 100);
};

// Demo records never enter the real order/payment stores or APIs.
export const simulateCheckout = ({ storage, customerId, groups, handling, total, method, address, destination, handlingPerStore = false }) => {
  if (!customerId || !groups.length || groups.some((group) => !group.storeId || !group.items.length)) throw new Error('Select a customer, store and items before demo checkout.');
  const orders = groups.map((group, index) => {
    const subtotal = group.items.reduce((sum, item) => {
      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) throw new Error('Invalid demo quantity.');
      return sum + cents(item.price) * Number(item.quantity);
    }, 0);
    const handlingFee = handlingPerStore ? 5 : (index === 0 ? Number(handling) : 0);
    return { ...group, handlingFee, subtotal: subtotal / 100, total: (subtotal + cents(group.delivery) + cents(handlingFee)) / 100 };
  });
  if (orders.reduce((sum, order) => sum + cents(order.total), 0) !== cents(total)) throw new Error('Demo totals differ. Refresh checkout before retrying.');
  const snapshot = { customerId, orders, method, address, total, destination };
  const key = `spices:demo-checkout:${customerId}`;
  const previous = JSON.parse(storage.getItem(key) || 'null');
  const fingerprint = JSON.stringify(snapshot);
  if (previous?.fingerprint === fingerprint) return previous.result;
  const id = `DEMO-${crypto.randomUUID()}`;
  const paymentId = `DEMO-PAYMENT-${crypto.randomUUID()}`;
  const result = { ...snapshot, id, paymentId, status: 'SIMULATED', createdAt: new Date().toISOString(), orders: orders.map((order) => ({ ...order, id: `DEMO-ORDER-${crypto.randomUUID()}`, checkoutId: id, paymentId, paymentStatus: 'SIMULATED' })) };
  storage.setItem(key, JSON.stringify({ fingerprint, result }));
  return result;
};
