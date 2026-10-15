import { transferGuestStoreCart } from './guestCartTransfer.js';

const sameItem = (left, right) => left.productId === right.productId && (left.variantId ?? null) === (right.variantId ?? null);

// Resolve every backend item ID from an owned, current store-cart response.
export const mutateAuthenticatedCart = async ({ customerId, storeId, item, operation, delta = 0,
  api, checkInventory, storage = localStorage, onReconciled = () => {} }) => {
  if (!customerId || !storeId) throw new Error('A customer and store are required.');
  let cart;
  try { cart = await api.getActiveCart({ customerId, storeId }); }
  catch (error) {
    if (Number(error.status) !== 404) throw error;
    cart = await api.createCart({ customerId, storeId });
  }
  if (cart?.customerId !== customerId || cart.storeId !== storeId || !cart.id || cart.status !== 'ACTIVE') throw new Error('Cart ownership, store or active status mismatch.');
  cart = await transferGuestStoreCart(customerId, cart, api, storage, checkInventory);
  onReconciled(cart);
  if (operation === 'clear') return api.clearCartItems(cart.id);
  const existing = cart.items.find(line => sameItem(line, item));
  if (operation === 'remove') return existing ? api.removeCartItem(cart.id, existing.id) : cart;
  const quantity = operation === 'add'
    ? Number(existing?.quantity || 0) + Number(item.quantity || 1)
    : Number(existing?.quantity || 0) + Number(delta);
  if (!Number.isInteger(quantity)) throw new Error('Choose a valid item quantity.');
  if (quantity <= 0) return existing ? api.removeCartItem(cart.id, existing.id) : cart;
  if (operation !== 'add' && !existing) throw new Error('Cart item was not found. Refresh your cart.');
  const projected = cart.items.filter(line => !sameItem(line, item));
  projected.push({ ...item, quantity });
  if (operation === 'add' || delta > 0) await checkInventory([{ storeId, items: projected }]);
  if (operation === 'add') return api.addCartItem(cart.id, {
    productId: item.productId, variantId: item.variantId ?? null, productName: item.productName || item.title,
    quantity: Number(item.quantity || 1), unitPrice: Number(item.unitPrice ?? item.price),
  });
  return api.updateCartItem(cart.id, existing.id, { quantity });
};
