export const checkoutGroupView = (group) => {
  const children = Array.isArray(group?.children) ? group.children : [];
  const states = ['PREPARED', 'RESERVING', 'COMMITTING', 'COMPENSATING', 'COMPLETED', 'FAILED'];
  const validState = states.includes(group?.state);
  const total = Number(group?.aggregateTotal);
  const complete = validState && group.state === 'COMPLETED' && !group.recoveryRequired
    && children.length > 0 && children.every((child) => child.orderId && child.state === 'CONFIRMED')
    && group.aggregateTotal != null && Number.isFinite(total) && total > 0;
  return {
    children,
    complete,
    failed: group?.state === 'FAILED',
    canStartNew: group?.state === 'FAILED' && !group.recoveryRequired && children.length > 0
      && children.every(child => child.state === 'RELEASED' && !child.orderId),
    unresolved: !complete && group?.state !== 'FAILED',
    total: complete ? total : null,
    label: complete ? 'Orders saved' : group?.recoveryRequired ? 'Checkout needs recovery' : ({
      PREPARED: 'Validating checkout', RESERVING: 'Reserving store inventory',
      COMMITTING: 'Confirming store orders', COMPENSATING: 'Releasing checkout reservations',
      FAILED: 'Checkout unsuccessful',
    }[group?.state] || 'Checkout needs verification'),
  };
};

export const resetFailedCheckout = (group, customerId, storage = sessionStorage) => {
  if (!customerId || group?.customerId !== customerId || !checkoutGroupView(group).canStartNew) {
    throw new Error('Only your fully compensated failed checkout can be replaced.');
  }
  const slots = [];
  for (const child of group.children) {
    const slot = `checkout-cart:${customerId}:${child.storeId}`;
    const raw = storage.getItem(slot);
    if (raw && JSON.parse(raw).cartId !== child.cartId) throw new Error('A different checkout is already using this store cart.');
    if (raw) slots.push(slot);
  }
  const raw = storage.getItem('checkout-group-attempt');
  if (raw) {
    const stores = JSON.parse(JSON.parse(raw).body).stores;
    if (!Array.isArray(stores) || stores.length !== group.children.length || !stores.every(store => store.customerId === customerId
      && group.children.some(child => child.storeId === store.storeId && child.cartId === store.cartId))
      || !group.children.every(child => stores.filter(store => child.storeId === store.storeId && child.cartId === store.cartId).length === 1)) {
      throw new Error('A different checkout attempt must not be cleared.');
    }
    slots.push('checkout-group-attempt');
  }
  // Clear only browser retry metadata after a fresh owner-protected terminal read; database history stays intact.
  slots.forEach(slot => storage.removeItem(slot));
};

export const submitCheckoutGroup = async (stores, request, storage = sessionStorage, lookup, beforeSubmit) => {
  const body = JSON.stringify({ stores: [...stores].sort((a, b) => a.storeId.localeCompare(b.storeId)) });
  const name = 'checkout-group-attempt';
  let attempt;
  try { attempt = JSON.parse(storage.getItem(name)); } catch { /* Unreadable local metadata is not an accepted checkout. */ }
  if (attempt?.submitted && attempt.body !== body) {
    let previousOwner;
    try { previousOwner = JSON.parse(attempt.body).stores[0]?.customerId; } catch { /* Reject an unresolved malformed attempt. */ }
    if (!previousOwner || previousOwner === stores[0]?.customerId) {
      const previous = lookup ? await lookup(attempt.key) : null;
      if (!['COMPLETED', 'FAILED'].includes(previous?.state)) {
        throw new Error('An existing checkout must be resolved before changing this checkout. Retry its original cart and address.');
      }
    }
  }
  if (!attempt || attempt.body !== body) {
    attempt = { body, key: crypto.randomUUID() };
    storage.setItem(name, JSON.stringify(attempt));
  }
  if (attempt.submitted && lookup) {
    try {
      const existing = await lookup(attempt.key);
      if (existing.state !== 'PREPARED') return existing;
    } catch (reason) {
      if (Number(reason.status) !== 404) throw reason;
    }
  }
  if (beforeSubmit) await beforeSubmit();
  storage.setItem(name, JSON.stringify({ ...attempt, submitted: true }));
  // Retain the key on timeout, partial progress and success so a lost response cannot duplicate orders.
  return request(body, attempt.key);
};
