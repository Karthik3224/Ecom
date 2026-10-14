export const DEMO_TRACKING_INTERVAL = 15000;
export const DEMO_TRACKING_STAGES = ['Order confirmed', 'Preparing your order', 'Packed', 'Out for delivery', 'Delivered'];

export const demoTrackingSnapshot = (startedAt, now) => {
  if (!Number.isFinite(startedAt) || !Number.isFinite(now)) throw new Error('Invalid demo tracking time.');
  const index = Math.min(DEMO_TRACKING_STAGES.length - 1, Math.max(0, Math.floor((now - startedAt) / DEMO_TRACKING_INTERVAL)));
  return { index, label: DEMO_TRACKING_STAGES[index], events: DEMO_TRACKING_STAGES.slice(0, index + 1).map((label, stage) => ({ label, time: startedAt + stage * DEMO_TRACKING_INTERVAL })) };
};

export const startDemoTracking = (storage, customerId, orderId, now) => {
  if (!customerId || !orderId?.startsWith('DEMO-')) throw new Error('Demo tracking requires a demo order.');
  const key = `spices:demo-tracking:${customerId}:${orderId}`;
  const existing = storage.getItem(key);
  if (existing !== null && existing !== undefined && Number.isFinite(Number(existing))) return Number(existing);
  storage.setItem(key, String(now));
  return now;
};

const managedKey = (customerId, orderId) => `spices:demo-managed-tracking:${customerId}:${orderId}`;
export const readManagedDemoTracking = (storage, customerId, order, createdAt) => {
  const saved = storage.getItem(managedKey(customerId, order.id));
  const events = saved ? JSON.parse(saved).events : [{ label: DEMO_TRACKING_STAGES[0], time: new Date(createdAt).getTime() }];
  return { index: events.length - 1, label: events.at(-1).label, events };
};

export const listManagerDemoOrders = (storage, actor) => {
  if (actor?.role !== 'store-manager' || !actor.storeId) return [];
  const rows = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith('spices:demo-checkout:')) continue;
    try {
      const result = JSON.parse(storage.getItem(key))?.result;
      if (result?.status !== 'SIMULATED' || !result.customerId) continue;
      for (const order of result.orders || []) {
        if (order.storeId === actor.storeId && order.id?.startsWith('DEMO-')) rows.push({ ...order, customerId: result.customerId, createdAt: result.createdAt });
      }
    } catch { /* Ignore unrelated malformed presentation records. */ }
  }
  return rows;
};

export const advanceManagerDemoOrder = (storage, actor, customerId, orderId, nextIndex, now) => {
  const order = listManagerDemoOrders(storage, actor).find((row) => row.id === orderId && row.customerId === customerId);
  if (!actor?.id || !order) throw new Error('This demo order is not assigned to your store.');
  const current = readManagedDemoTracking(storage, customerId, order, order.createdAt);
  if (nextIndex === current.index) return current;
  if (nextIndex !== current.index + 1 || nextIndex >= DEMO_TRACKING_STAGES.length) throw new Error('Advance one delivery stage at a time.');
  const events = [...current.events, { label: DEMO_TRACKING_STAGES[nextIndex], time: now, actorId: actor.id }];
  storage.setItem(managedKey(customerId, orderId), JSON.stringify({ events }));
  return { index: nextIndex, label: events.at(-1).label, events };
};
