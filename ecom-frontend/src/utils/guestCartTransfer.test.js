import test from 'node:test';
import assert from 'node:assert/strict';
import { transferGuestStoreCart } from './guestCartTransfer.js';

test('guest transfer retries a lost response without double adding and preserves other stores', async () => {
  const item = { productId: 'product', storeId: 'store', quantity: 2, unitPrice: 10, title: 'Product' };
  const other = { ...item, storeId: 'other' };
  const data = new Map([['guestCartItems', JSON.stringify([item, other])]]);
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const cart = { id: 'cart', customerId: 'owner', storeId: 'store' };
  const accepted = new Set();
  let quantity = 0;
  let calls = 0;
  const api = { addCartItem: async (_id, body, key) => {
    if (!accepted.has(key)) { accepted.add(key); quantity += body.quantity; }
    if (++calls === 1) throw new Error('lost response');
    return cart;
  } };
  await assert.rejects(transferGuestStoreCart('owner', cart, api, storage), /lost response/);
  assert.deepEqual(JSON.parse(storage.getItem('guestCartItems')), [item, other]);
  await transferGuestStoreCart('owner', cart, api, storage);
  assert.equal(quantity, 2);
  assert.equal(accepted.size, 1);
  assert.deepEqual(JSON.parse(storage.getItem('guestCartItems')), [other]);
});

test('guest transfer rejects foreign carts before touching guest storage or APIs', async () => {
  await assert.rejects(transferGuestStoreCart('owner', { id: 'cart', customerId: 'other', storeId: 'store' },
    { addCartItem: () => assert.fail('No foreign write') }, { getItem: () => assert.fail('No guest storage access') }), /ownership/);
});

test('lost guest transfer cannot replay against a replacement cart', async () => {
  const item = { productId: 'product', storeId: 'store', quantity: 1, unitPrice: 10, title: 'Product' };
  const data = new Map([['guestCartItems', JSON.stringify([item])]]);
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const cart = { id: 'original', customerId: 'owner', storeId: 'store' };
  await assert.rejects(transferGuestStoreCart('owner', cart, { addCartItem: async () => { throw new Error('timeout'); } }, storage), /timeout/);
  await assert.rejects(transferGuestStoreCart('owner', { ...cart, id: 'replacement' },
    { addCartItem: () => assert.fail('No replacement-cart write') }, storage), /saved guest cart/);
  assert.deepEqual(JSON.parse(storage.getItem('guestCartItems')), [item]);
});
