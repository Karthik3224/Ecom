import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutGroupView, submitCheckoutGroup, resetFailedCheckout } from './checkoutGroup.js';

test('success requires every child confirmed and a persisted aggregate', () => {
  const group = { state: 'COMPLETED', aggregateTotal: '50.00', children: [
    { orderId: 'a', state: 'CONFIRMED' }, { orderId: 'b', state: 'CONFIRMED' },
  ] };
  assert.equal(checkoutGroupView(group).complete, true);
  assert.equal(checkoutGroupView(group).total, 50);
  assert.equal(checkoutGroupView({ ...group, aggregateTotal: null }).complete, false);
  assert.equal(checkoutGroupView({ ...group, children: [...group.children, { state: 'RESERVED' }] }).complete, false);
});

test('partial creation and compensation cannot become payment or checkout success', () => {
  for (const state of ['PREPARED', 'RESERVING', 'COMMITTING', 'COMPENSATING', 'UNKNOWN']) {
    const view = checkoutGroupView({ state, aggregateTotal: 50, children: [{ orderId: 'a', state: 'CONFIRMED' }] });
    assert.equal(view.complete, false);
    assert.equal(view.unresolved, true);
    assert.equal(view.total, null);
  }
  assert.equal(checkoutGroupView({ state: 'FAILED' }).failed, true);
});

test('timeout retry and reordered stores retain checkout identity', async () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const keys = [];
  const stores = [{ storeId: 'b', customerId: 'owner' }, { storeId: 'a', customerId: 'owner' }];
  await assert.rejects(submitCheckoutGroup(stores, async (_body, key) => { keys.push(key); throw new Error('Timeout'); }, storage));
  await submitCheckoutGroup([...stores].reverse(), async (_body, key) => { keys.push(key); return { state: 'RESERVING' }; }, storage);
  assert.equal(keys[0], keys[1]);
  await submitCheckoutGroup([{ storeId: 'a', customerId: 'another-owner' }], async (_body, key) => { assert.notEqual(key, keys[0]); }, storage);
});
test('unknown response queries owner-bound checkout before another submission', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const stores = [{ storeId: 'a', customerId: 'owner' }];
  let calls = 0;
  const request = async () => { calls++; throw new Error('Unknown timeout'); };
  await assert.rejects(submitCheckoutGroup(stores, request, storage));
  const existing = { id: 'saved-group', state: 'RESERVING' };
  assert.equal(await submitCheckoutGroup(stores, request, storage, async () => existing), existing);
  assert.equal(calls, 1);
  await assert.rejects(submitCheckoutGroup(stores, request, storage, async () => { throw Object.assign(new Error('Offline'), { status: 503 }); }), /Offline/);
  assert.equal(calls, 1);
});
test('missing attempt and durable PREPARED retry use the same key', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const stores = [{ storeId: 'a', customerId: 'owner' }];
  const keys = [];
  const request = async (_body, key) => { keys.push(key); return { state: 'RESERVING' }; };
  await submitCheckoutGroup(stores, request, storage);
  await submitCheckoutGroup(stores, request, storage, async () => { throw { status: 404 }; });
  await submitCheckoutGroup(stores, request, storage, async () => ({ state: 'PREPARED' }));
  assert.equal(new Set(keys).size, 1);
});

test('changing an unresolved checkout cannot replace its retry identity', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const stores = [{ storeId: 'a', customerId: 'owner' }];
  await assert.rejects(submitCheckoutGroup(stores, async () => { throw new Error('Timeout'); }, storage));
  const original = values.get('checkout-group-attempt');
  await assert.rejects(submitCheckoutGroup([...stores, { storeId: 'b', customerId: 'owner' }], async () => assert.fail('Must not submit'), storage), /existing checkout must be resolved/);
  assert.equal(values.get('checkout-group-attempt'), original);
});

test('a verified terminal previous checkout permits a new checkout identity', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const keys = [];
  const request = async (_body, key) => { keys.push(key); return { state: 'RESERVING' }; };
  await submitCheckoutGroup([{ storeId: 'a', customerId: 'owner' }], request, storage);
  await submitCheckoutGroup([{ storeId: 'b', customerId: 'owner' }], request, storage, async () => ({ state: 'COMPLETED' }));
  assert.equal(keys.length, 2);
  assert.notEqual(keys[0], keys[1]);
});

const failedAttempt = () => {
  const children = ['a', 'b'].map(storeId => ({ storeId, cartId: `old-${storeId}`, state: 'RELEASED', orderId: null }));
  const group = { customerId: 'owner', state: 'FAILED', children, recoveryRequired: false };
  const stores = children.map(child => ({ ...child, customerId: 'owner' }));
  const values = new Map([['checkout-group-attempt', JSON.stringify({ key: 'old-key', body: JSON.stringify({ stores }) })]]);
  for (const child of children) values.set(`checkout-cart:owner:${child.storeId}`, JSON.stringify({ cartId: child.cartId }));
  values.set('unrelated', 'keep');
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  return { group, storage, values };
};

test('fully compensated owner failure clears only its browser metadata for a fresh checkout', () => {
  const { group, storage, values } = failedAttempt();
  resetFailedCheckout(group, 'owner', storage);
  assert.deepEqual([...values], [['unrelated', 'keep']]);
});

test('foreign, incomplete and persisted-child checkouts cannot clear retry identities', () => {
  for (const change of [{ customerId: 'foreign' }, { state: 'COMPENSATING' }, { recoveryRequired: true }, { children: [{ storeId: 'a', state: 'RELEASED', orderId: 'saved' }] }]) {
    const { group, storage, values } = failedAttempt();
    const before = [...values];
    assert.throws(() => resetFailedCheckout({ ...group, ...change }, 'owner', storage));
    assert.deepEqual([...values], before);
  }
});

test('newer cart or unrelated group attempt is never discarded by an old failure', () => {
  for (const groupChanged of [false, true]) {
    const { group, storage, values } = failedAttempt();
    values.set(groupChanged ? 'checkout-group-attempt' : 'checkout-cart:owner:b', groupChanged
      ? JSON.stringify({ body: JSON.stringify({ stores: [{ customerId: 'owner', storeId: 'new', cartId: 'new' }] }) })
      : JSON.stringify({ cartId: 'newer-cart' }));
    const before = [...values];
    assert.throws(() => resetFailedCheckout(group, 'owner', storage));
    assert.deepEqual([...values], before);
  }
});

test('a fresh attempt after compensated failure uses new cart IDs and retry key', async () => {
  const { group, storage } = failedAttempt();
  resetFailedCheckout(group, 'owner', storage);
  await submitCheckoutGroup(group.children.map(child => ({ customerId: 'owner', storeId: child.storeId, cartId: `new-${child.storeId}` })), async (body, key) => {
    assert.notEqual(key, 'old-key');
    assert.deepEqual(JSON.parse(body).stores.map(store => store.cartId), ['new-a', 'new-b']);
  }, storage);
});
