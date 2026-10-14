import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateCheckout } from './demoCheckout.js';
const setup = () => {
  const records = new Map();
  return { storage: { getItem: (key) => records.get(key), setItem: (key, value) => records.set(key, value) }, customerId: 'demo-user', groups: [{ storeId: 'a', items: [{ price: 100, quantity: 1 }], delivery: 50 }, { storeId: 'b', items: [{ price: 200, quantity: 2 }], delivery: 60 }], handling: 5, total: 615, method: 'DEMO_UPI', address: 'Test address' };
};
test('demo splits stores, allocates handling once and repeats the same result on retry', () => {
  const input = setup();
  const first = simulateCheckout(input);
  assert.equal(first.status, 'SIMULATED');
  assert.match(first.paymentId, /^DEMO-PAYMENT-/);
  assert.equal(new Set([first.id, first.paymentId, ...first.orders.map(order => order.id)]).size, 4);
  assert.ok(first.orders.every(order => order.checkoutId === first.id && order.paymentId === first.paymentId && order.paymentStatus === 'SIMULATED'));
  assert.deepEqual(first.orders.map((order) => order.total), [155, 460]);
  assert.equal(simulateCheckout(input).id, first.id);
  assert.equal(simulateCheckout(input).paymentId, first.paymentId);
  assert.notEqual(simulateCheckout({ ...input, customerId: 'other' }).id, first.id);
});
test('demo rejects mismatched totals and invalid quantities before persistence', () => {
  const input = setup();
  assert.throws(() => simulateCheckout({ ...input, total: 1 }), /totals differ/);
  assert.equal(input.storage.getItem('spices:demo-checkout:demo-user'), undefined);
  assert.throws(() => simulateCheckout({ ...input, groups: [{ storeId: 'a', items: [{ price: 1, quantity: -1 }], delivery: 0 }] }), /quantity/);
});
test('presentation applies five rupees to each store and retries without duplicates', () => {
  const input = { ...setup(), handlingPerStore: true, handling: 10, total: 620 };
  const result = simulateCheckout(input);
  assert.deepEqual(result.orders.map((order) => order.handlingFee), [5, 5]);
  assert.deepEqual(result.orders.map((order) => order.total), [155, 465]);
  assert.equal(result.status, 'SIMULATED');
  assert.equal(simulateCheckout(input).id, result.id);
  assert.throws(() => simulateCheckout({ ...input, total: 615 }), /totals differ/);
});
