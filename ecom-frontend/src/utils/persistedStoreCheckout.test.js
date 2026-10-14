import test from 'node:test';
import assert from 'node:assert/strict';
import { persistStoreCheckout } from './persistedStoreCheckout.js';

const fixture = () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const stores = ['b', 'a'].map(storeId => ({ customerId: 'owner', storeId, items: [{ productId: storeId, quantity: 1, unitPrice: 10 }] }));
  const cart = storeId => ({ id: `cart-${storeId}`, customerId: 'owner', storeId, status: 'ACTIVE', items: stores.find(store => store.storeId === storeId).items });
  const cartApi = { getActiveCart: async ({ storeId }) => cart(storeId), getCart: async id => cart(id.slice(5)) };
  return { customerId: 'owner', stores, storage, cartApi };
};

test('one-store local checkout uses saved cart and durable retry rather than simulation', async () => {
  const input = fixture();
  input.stores = input.stores.slice(0, 1);
  const keys = [];
  const request = async (body, key) => {
    keys.push(key);
    const payload = JSON.parse(body);
    assert.equal(payload.stores.length, 1);
    assert.equal(payload.stores[0].cartId, 'cart-b');
    return { id: 'saved-group', customerId: 'owner', state: 'RESERVING' };
  };
  assert.equal((await persistStoreCheckout({ ...input, request })).state, 'RESERVING');
  await persistStoreCheckout({ ...input, request });
  assert.equal(keys[0], keys[1]);
  await assert.rejects(persistStoreCheckout({ ...input, stores: [], request }), /at least one store/);
});
test('persisted checkout submits separate verified store carts, without inventing success', async () => {
  const input = fixture();
  const result = await persistStoreCheckout({ ...input, request: async body => {
    const { stores } = JSON.parse(body);
    assert.deepEqual(stores.map(store => store.cartId), ['cart-a', 'cart-b']);
    assert.deepEqual(stores.map(store => store.items[0].productId), ['a', 'b']);
    return { id: 'group', customerId: 'owner', state: 'RESERVING' };
  } });
  assert.equal(result.state, 'RESERVING');
});
test('lost persisted checkout response retains the same group retry identity', async () => {
  const input = fixture();
  const keys = [];
  await assert.rejects(persistStoreCheckout({ ...input, request: async (_body, key) => { keys.push(key); throw new Error('Timeout'); } }));
  await persistStoreCheckout({ ...input, request: async (_body, key) => { keys.push(key); return { id: 'group', customerId: 'owner', state: 'COMMITTING' }; } });
  assert.equal(keys[0], keys[1]);
});
test('foreign store intent and foreign backend group cannot be accepted', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input, stores: [{ ...input.stores[0], customerId: 'other' }, input.stores[1]] }), /ownership/);
  await assert.rejects(persistStoreCheckout({ ...input, request: async () => ({ id: 'group', customerId: 'other' }) }), /owned checkout/);
});

test('missing inventory prevents cart preparation and checkout writes', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input,
    cartApi: { getActiveCart: async () => assert.fail('Must not prepare carts') },
    checkInventory: async () => { throw new Error('Missing stock'); },
    request: async () => assert.fail('Must not submit checkout'),
  }), /Missing stock/);
});

test('unknown-result retry reads saved checkout before inspecting spent inventory', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input, request: async () => { throw new Error('Lost response'); } }));
  const result = await persistStoreCheckout({ ...input,
    lookup: async () => ({ id: 'saved', customerId: 'owner', state: 'COMPLETED' }),
    checkInventory: async () => assert.fail('Do not reject a saved checkout based on already spent stock'),
    request: async () => assert.fail('No duplicate submission'),
  });
  assert.equal(result.id, 'saved');
});

test('changed cart resumes unresolved saved group before any cart or stock writes', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input, request: async () => { throw new Error('Timeout'); } }));
  const original = input.storage.getItem('checkout-group-attempt');
  const stores = input.stores.map(store => ({ ...store, items: [{ ...store.items[0], quantity: 2 }] }));
  const group = { id: 'existing', customerId: 'owner', state: 'RESERVING' };
  const result = await persistStoreCheckout({ ...input, stores, lookup: async () => group,
    cartApi: { getCart: async () => assert.fail('No cart mutation') },
    checkInventory: async () => assert.fail('Resolve existing first'), request: async () => assert.fail('No new submission') });
  assert.equal(result, group);
  assert.equal(input.storage.getItem('checkout-group-attempt'), original);
});

test('changed cart after verified completed group starts fresh carts and retry key', async () => {
  const input = fixture();
  await persistStoreCheckout({ ...input, request: async () => ({ id: 'old', customerId: 'owner', state: 'RESERVING' }) });
  const old = JSON.parse(input.storage.getItem('checkout-group-attempt'));
  const previous = JSON.parse(old.body).stores;
  const group = { id: 'old', customerId: 'owner', state: 'COMPLETED', aggregateTotal: 30,
    children: previous.map(store => ({ storeId: store.storeId, cartId: store.cartId, orderId: `order-${store.storeId}`, state: 'CONFIRMED' })) };
  const stores = input.stores.map(store => ({ ...store, items: [{ ...store.items[0], quantity: 2 }] }));
  const cart = storeId => ({ id: `fresh-${storeId}`, customerId: 'owner', storeId, status: 'ACTIVE', items: stores.find(store => store.storeId === storeId).items });
  let checked = false;
  const result = await persistStoreCheckout({ ...input, stores, lookup: async () => group,
    checkInventory: async () => { checked = true; },
    cartApi: { getActiveCart: async ({ storeId }) => cart(storeId), getCart: async id => cart(id.slice(6)) },
    request: async (body, key) => { assert.notEqual(key, old.key); assert.ok(checked);
      assert.ok(JSON.parse(body).stores.every(store => store.cartId.startsWith('fresh-')));
      return { id: 'new', customerId: 'owner', state: 'RESERVING' }; } });
  assert.equal(result.id, 'new');
});

test('foreign lookup and unavailable lookup cannot clear retry metadata', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input, request: async () => { throw new Error('Timeout'); } }));
  const original = input.storage.getItem('checkout-group-attempt');
  const stores = input.stores.map(store => ({ ...store, items: [{ ...store.items[0], quantity: 2 }] }));
  for (const lookup of [async () => ({ id: 'foreign', customerId: 'other', state: 'COMPLETED' }), async () => { throw new Error('Offline'); }]) {
    await assert.rejects(persistStoreCheckout({ ...input, stores, lookup }));
    assert.equal(input.storage.getItem('checkout-group-attempt'), original);
  }
});
