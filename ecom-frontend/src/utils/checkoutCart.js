export const prepareCheckoutCart = async (customerId, storeId, items, api, storage = sessionStorage, allowContentChange = false) => {
  const slot = `checkout-cart:${customerId}:${storeId}`;
  const body = JSON.stringify(items);
  let saved = JSON.parse(storage.getItem(slot) || 'null');
  const changing = saved && saved.body !== body;
  if (changing && !allowContentChange) throw new Error('Retry the unresolved checkout before changing cart contents.');
  let cart;
  if (saved) cart = await api.getCart(saved.cartId);
  else {
    try { cart = await api.getActiveCart({ customerId, storeId }); }
    catch (error) {
      if (error.status !== 404) throw error;
      cart = await api.createCart({ customerId, storeId });
    }
  }
  if (cart.customerId !== customerId || cart.storeId !== storeId) throw new Error('Cart ownership or store mismatch.');
  const same = (left, right) => left.productId === right.productId && (left.variantId ?? null) === (right.variantId ?? null);
  if (changing) {
    if (cart.status !== 'ACTIVE') throw new Error('The previous cart is claimed by checkout. Open its saved checkout before changing items.');
    const previous = JSON.parse(saved.body);
    if (!cart.items.every(line => previous.some(item => same(line, item) && line.quantity === item.quantity))) {
      throw new Error('The saved cart changed in another session. Review it before replacing items.');
    }
    saved = { body, cartId: cart.id, keys: items.map(() => crypto.randomUUID()) };
    storage.setItem(slot, JSON.stringify(saved));
    for (const line of cart.items) {
      if (!items.some(item => same(line, item))) cart = await api.removeCartItem(cart.id, line.id);
    }
  }
  const plan = saved || { body, cartId: cart.id, keys: items.map(() => crypto.randomUUID()) };
  storage.setItem(slot, JSON.stringify(plan));
  if (cart.status === 'CHECKED_OUT') return cart;
  if (cart.items.some(line => !items.some(item => same(line, item)))) throw new Error('Your saved cart contains other items. Review it before checkout.');
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const existing = cart.items.find(line => same(line, item));
    if (existing) {
      if (existing.quantity !== item.quantity) cart = await api.updateCartItem(cart.id, existing.id, { quantity: item.quantity });
    } else cart = await api.addCartItem(cart.id, item, plan.keys[index]);
  }
  return api.getCart(cart.id);
};

export const finishCheckoutCart = (customerId, storeId, storage = sessionStorage) => {
  storage.removeItem(`checkout-cart:${customerId}:${storeId}`);
};
