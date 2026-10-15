import { requestId } from './requestId.js';

// Keep each guest line and its retry identity until the server acknowledges it.
export const transferGuestStoreCart = async (customerId, cart, api, storage = localStorage, checkInventory) => {
  if (!customerId || cart?.customerId !== customerId || !cart.id || !cart.storeId) throw new Error('Cart ownership or store mismatch.');
  const items = JSON.parse(storage.getItem('guestCartItems') || '[]');
  for (const item of items.filter(item => item.storeId === cart.storeId)) {
    const slot = `guest-transfer:${customerId}:${cart.storeId}:${item.productId}:${item.variantId ?? ''}`;
    const body = JSON.stringify({ productId: item.productId, variantId: item.variantId ?? null,
      productName: item.productName || item.title, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice ?? item.price) });
    const saved = JSON.parse(storage.getItem(slot) || 'null');
    if (saved && (saved.body !== body || saved.cartId !== cart.id)) throw new Error('Retry the saved guest cart before changing its items or cart.');
    const existing = cart.items?.find(line => line.productId === item.productId && (line.variantId ?? null) === (item.variantId ?? null));
    const attempt = saved || { body, cartId: cart.id, key: requestId(), targetQuantity: Number(existing?.quantity || 0) + Number(item.quantity) };
    if (!Number.isInteger(attempt.targetQuantity) || attempt.targetQuantity < 1) throw new Error('The saved guest transfer needs verification before it can be retried.');
    const projected = (cart.items || []).filter(line => line !== existing);
    projected.push({ ...item, quantity: Math.max(Number(existing?.quantity || 0), attempt.targetQuantity) });
    if (checkInventory) await checkInventory([{ storeId: cart.storeId, items: projected }]);
    storage.setItem(slot, JSON.stringify(attempt));
    cart = await api.addCartItem(cart.id, JSON.parse(body), attempt.key);
    if (cart?.customerId !== customerId || cart.id !== attempt.cartId || cart.storeId !== item.storeId) throw new Error('Cart ownership or store mismatch.');
    if (checkInventory) await checkInventory([{ storeId: cart.storeId, items: cart.items }]);
    const remaining = JSON.parse(storage.getItem('guestCartItems') || '[]')
      .filter(line => !(line.storeId === item.storeId && line.productId === item.productId && (line.variantId ?? null) === (item.variantId ?? null)));
    storage.setItem('guestCartItems', JSON.stringify(remaining));
    storage.removeItem(slot);
  }
  return cart;
};
