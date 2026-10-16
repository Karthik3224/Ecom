import test from 'node:test';
import assert from 'node:assert/strict';
import { requestId } from './requestId.js';
import { prepareCheckoutCart } from './checkoutCart.js';

test('public HTTP origins generate unique v4 retry IDs using getRandomValues', () => {
  const httpCrypto = { getRandomValues: array => globalThis.crypto.getRandomValues(array) };
  const ids = new Set(Array.from({ length: 100 }, () => requestId(httpCrypto)));
  assert.equal(ids.size, 100);
  for (const id of ids) assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});

test('HTTP checkout retains its generated add key when a response is lost', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const source = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues: array => source.getRandomValues(array) } });
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const cart = { id: 'cart', customerId: 'owner', storeId: 'store', status: 'ACTIVE', items: [] };
  const keys = [];
  const api = { getActiveCart: async () => cart, getCart: async () => cart,
    addCartItem: async (_id, _item, key) => { keys.push(key); throw new Error('lost response'); } };
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(prepareCheckoutCart('owner', 'store', [{ productId: 'product', quantity: 1 }], api, storage), /lost response/);
    }
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
  } finally { Object.defineProperty(globalThis, 'crypto', descriptor); }
});
