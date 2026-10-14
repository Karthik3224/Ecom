import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceManagerDemoOrder, demoTrackingSnapshot, listManagerDemoOrders, readManagedDemoTracking, startDemoTracking } from './demoTracking.js';

test('manager updates persist, remain idempotent and are reflected to the customer without timers', () => {
  const values = new Map();
  const storage = { get length() { return values.size; }, key: (index) => [...values.keys()][index], getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const order = { id: 'DEMO-store-1', storeId: 'store-1', items: [] };
  storage.setItem('spices:demo-checkout:customer', JSON.stringify({ result: { status: 'SIMULATED', customerId: 'customer', createdAt: '2026-10-11T00:00:00Z', orders: [order] } }));
  const actor = { id: 'manager', role: 'store-manager', storeId: 'store-1' };
  assert.equal(listManagerDemoOrders(storage, actor).length, 1);
  assert.equal(readManagedDemoTracking(storage, 'customer', order, '2026-10-11T00:00:00Z').index, 0);
  const updated = advanceManagerDemoOrder(storage, actor, 'customer', order.id, 1, 1000);
  assert.equal(updated.label, 'Preparing your order');
  assert.equal(updated.events[1].actorId, 'manager');
  assert.deepEqual(advanceManagerDemoOrder(storage, actor, 'customer', order.id, 1, 2000), updated);
  assert.deepEqual(readManagedDemoTracking(storage, 'customer', order), updated);
  assert.throws(() => advanceManagerDemoOrder(storage, actor, 'customer', order.id, 3, 3000), /one delivery stage/);
  for (const denied of [{ ...actor, storeId: 'other-store' }, { ...actor, role: 'customer' }]) {
    assert.equal(listManagerDemoOrders(storage, denied).length, 0);
    assert.throws(() => advanceManagerDemoOrder(storage, denied, 'customer', order.id, 2, 4000), /not assigned/);
  }
  assert.throws(() => advanceManagerDemoOrder(storage, actor, 'other-customer', order.id, 2, 5000), /not assigned/);
});

test('demo progresses in order and recovers elapsed stages without duplicate events', () => {
  assert.equal(demoTrackingSnapshot(1000, 1000).label, 'Order confirmed');
  assert.equal(demoTrackingSnapshot(1000, 16000).label, 'Preparing your order');
  const restored = demoTrackingSnapshot(1000, 61000);
  assert.equal(restored.label, 'Delivered');
  assert.equal(restored.events.length, 5);
  assert.deepEqual(demoTrackingSnapshot(1000, 999999), restored);
  assert.equal(demoTrackingSnapshot(1000, 0).index, 0);
});
test('tracking persists per customer and store order and rejects real orders', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(startDemoTracking(storage, 'a', 'DEMO-1', 1000), 1000);
  assert.equal(startDemoTracking(storage, 'a', 'DEMO-1', 2000), 1000);
  assert.equal(startDemoTracking(storage, 'a', 'DEMO-2', 3000), 3000);
  assert.equal(startDemoTracking(storage, 'b', 'DEMO-1', 4000), 4000);
  assert.throws(() => startDemoTracking(storage, 'a', 'real-order', 5000), /demo order/);
});
