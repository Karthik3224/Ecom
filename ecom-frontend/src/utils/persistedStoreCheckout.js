import { prepareCheckoutCart } from './checkoutCart.js';
import { checkoutGroupView, resetFailedCheckout, submitCheckoutGroup } from './checkoutGroup.js';

const intent = stores => JSON.stringify([...stores].sort((a, b) => a.storeId.localeCompare(b.storeId))
  .map(store => Object.fromEntries(Object.entries(store).filter(([key]) => key !== 'cartId'))));

export const persistStoreCheckout = async ({ customerId, stores, cartApi, request, lookup, lookupCart, checkInventory, storage = sessionStorage }) => {
  if (!customerId || !Array.isArray(stores) || stores.length < 1) throw new Error('A customer and at least one store are required.');
  const seen = new Set();
  for (const store of stores) {
    if (!store.storeId || store.customerId !== customerId || seen.has(store.storeId) || !store.items?.length) throw new Error('Invalid store checkout ownership or items.');
    seen.add(store.storeId);
  }
  // Recover saved work before posting a new key for an already claimed cart.
  const findSavedCheckout = async (body) => {
    if (!lookupCart) return null;
    for (const store of JSON.parse(body).stores) {
      let saved;
      try { saved = await lookupCart(store.cartId); }
      catch (error) {
        if (Number(error.status) === 404) continue;
        throw error;
      }
      if (!saved?.id || saved.customerId !== customerId || !saved.children?.some(child =>
        child.cartId === store.cartId && child.storeId === store.storeId)) {
        throw new Error('Checkout Service did not return an owned checkout for this cart.');
      }
      return saved;
    }
    return null;
  };
  const submitOrRecover = async (body, key) => {
    const existing = await findSavedCheckout(body);
    if (existing) return existing;
    try { return await request(body, key); }
    catch (reason) {
      if (Number(reason.status) !== 409 || !lookupCart) throw reason;
      // Another tab may have submitted after our read. Preserve its checkout.
      const saved = await findSavedCheckout(body);
      if (saved) return saved;
      throw reason;
    }
  };
  let submitted = false;
  const cached = storage.getItem('checkout-group-attempt');
  if (cached) {
    const attempt = JSON.parse(cached);
    const previous = JSON.parse(attempt.body).stores;
    submitted = Boolean(attempt.submitted && previous[0]?.customerId === customerId);
    // Resolve accepted work before touching carts, including when the customer changes items.
    if (submitted && lookup) {
      let existing;
      try { existing = await lookup(attempt.key); }
      catch (reason) { if (Number(reason.status) !== 404) throw reason; }
      if (!existing) {
        // A lookup can race an unacknowledged submission. Replay the exact
        // original body/key before touching any changed cart or address.
        const recovered = await submitOrRecover(attempt.body, attempt.key);
        if (!recovered?.id || recovered.customerId !== customerId) throw new Error('Checkout Service did not return an owned checkout group. Retry the same checkout.');
        return recovered;
      }
      if (existing) {
        if (!existing.id || existing.customerId !== customerId) throw new Error('Checkout Service did not return an owned checkout group.');
        const changed = intent(previous) !== intent(stores);
        if (!changed || !['COMPLETED', 'FAILED'].includes(existing.state)) return existing;
        if (existing.state === 'FAILED') {
          resetFailedCheckout(existing, customerId, storage);
        } else {
          if (!checkoutGroupView(existing).complete || previous.length !== existing.children.length
              || !previous.every(store => existing.children.some(child => child.storeId === store.storeId && child.cartId === store.cartId))) {
            throw new Error('Previous checkout must be verified before starting a new checkout.');
          }
          const slots = previous.map(store => `checkout-cart:${customerId}:${store.storeId}`);
          for (const [index, slot] of slots.entries()) {
            const raw = storage.getItem(slot);
            if (raw && JSON.parse(raw).cartId !== previous[index].cartId) throw new Error('A different checkout is using this store cart.');
          }
          slots.forEach(slot => storage.removeItem(slot));
          storage.removeItem('checkout-group-attempt');
        }
        submitted = false;
      }
    }
  }
  if (checkInventory && !submitted) await checkInventory(stores);
  const prepared = [];
  for (const store of [...stores].sort((a, b) => a.storeId.localeCompare(b.storeId))) {
    const cart = await prepareCheckoutCart(customerId, store.storeId, store.items, cartApi, storage, !submitted);
    if (!cart.id) throw new Error('Cart Service did not return a saved cart.');
    prepared.push({ ...store, cartId: cart.id });
  }
  const result = await submitCheckoutGroup(prepared, submitOrRecover, storage, lookup,
    checkInventory && submitted ? () => checkInventory(stores) : undefined);
  if (!result?.id || result.customerId !== customerId) throw new Error('Checkout Service did not return an owned checkout group. Retry the same checkout.');
  return result;
};
