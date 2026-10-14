import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderAttempt } from './orderCreationAttempt.js';

const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
test('lost response retains the same order key across retries', async () => {
  const storage = memory();
  const data = { customerId: 'customer', cartId: 'cart', storeId: 'store', items: [1] };
  let original;
  await assert.rejects(createOrderAttempt(data, async (_body, key) => { original = key; throw new Error('timeout'); }, storage));
  await assert.rejects(createOrderAttempt({ ...data, items: [2] }, async () => assert.fail('must not send changed order'), storage));
  await createOrderAttempt({ ...data, cartId: 'regenerated-cart' }, async (body, key) => { assert.equal(key, original); assert.equal(JSON.parse(body).cartId, 'cart'); return { id: 'order' }; }, storage);
  assert.equal(storage.getItem('order-attempt:customer:store'), undefined);
});
