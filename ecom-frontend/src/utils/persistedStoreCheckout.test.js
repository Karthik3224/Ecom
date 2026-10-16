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


test('changed address or cart after an unknown submission replays original request when lookup is not found', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input, request: async () => { throw new Error('Lost acknowledgement'); } }));
  const saved = JSON.parse(input.storage.getItem('checkout-group-attempt'));
  const changed = input.stores.map(store => ({ ...store, customerLatitude: 17.4, items: [{ ...store.items[0], quantity: 2 }] }));
  const result = await persistStoreCheckout({ ...input, stores: changed,
    lookup: async () => { throw Object.assign(new Error('Not found'), { status: 404 }); },
    cartApi: { getCart: async () => assert.fail('Do not modify the original uncertain carts') },
    checkInventory: async () => assert.fail('Do not inspect the changed cart before recovery'),
    request: async (body, key) => { assert.equal(body, saved.body);assert.equal(key, saved.key);return { id: 'recovered', customerId: 'owner', state: 'PREPARED' }; },
  });
  assert.equal(result.id, 'recovered');
  assert.equal(input.storage.getItem('checkout-group-attempt'), JSON.stringify(saved));
});

test('failed original-request replay retains all retry metadata', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input, request: async () => { throw new Error('Timeout'); } }));
  const saved = input.storage.getItem('checkout-group-attempt');
  const changed = input.stores.map(store => ({ ...store, customerLongitude: 78.4 }));
  await assert.rejects(persistStoreCheckout({ ...input, stores: changed,
    lookup: async () => { throw Object.assign(new Error('Not found'), { status: 404 }); },
    cartApi: { getCart: async () => assert.fail('No cart mutation during recovery') },
    request: async () => { throw new Error('Mapping unavailable'); },
  }), /Mapping unavailable/);
  assert.equal(input.storage.getItem('checkout-group-attempt'), saved);
});


test('saved checkout is recovered before a conflicting POST when local retry identity was lost', async () => {
  const input = fixture();
  const group = { id: 'original', customerId: 'owner', state: 'PREPARED',
    children: [{ storeId: 'a', cartId: 'cart-a', state: 'PREPARED' }] };
  let writes = 0;
  const request = async () => { writes++; throw Object.assign(new Error('Cart belongs to an existing checkout'), { status: 409 }); };
  const lookupCart = async cartId => { assert.equal(cartId, 'cart-a'); return group; };
  assert.equal(await persistStoreCheckout({ ...input, request, lookupCart }), group);
  const original = input.storage.getItem('checkout-group-attempt');
  assert.equal(await persistStoreCheckout({ ...input, request, lookupCart,
    lookup: async () => { throw Object.assign(new Error('Not found'), { status: 404 }); } }), group);
  assert.equal(input.storage.getItem('checkout-group-attempt'), original);
  assert.equal(writes, 0);
});

test('cart conflict recovery rejects foreign or mismatched groups and retains retry data', async () => {
  for (const group of [
    { id: 'foreign', customerId: 'other', children: [{ storeId: 'a', cartId: 'cart-a' }] },
    { id: 'wrong-cart', customerId: 'owner', children: [{ storeId: 'a', cartId: 'different' }] },
  ]) {
    const input = fixture();
    await assert.rejects(persistStoreCheckout({ ...input,
      request: async () => { throw Object.assign(new Error('Conflict'), { status: 409 }); },
      lookupCart: async () => group }), /owned checkout/);
    assert.ok(JSON.parse(input.storage.getItem('checkout-group-attempt')).submitted);
  }
});

test('missing cart recovery endpoint preserves original conflict without duplicate submission', async () => {
  const input = fixture();
  let writes = 0;
  await assert.rejects(persistStoreCheckout({ ...input,
    request: async () => { writes++; throw Object.assign(new Error('Cart conflict'), { status: 409 }); },
    lookupCart: async () => { throw Object.assign(new Error('Not found'), { status: 404 }); } }), /Cart conflict/);
  assert.equal(writes, 1);
});


test('recovery checks every store cart and preserves the original group rather than merging stores', async () => {
  const input = fixture();
  const lookedUp = [];
  const group = { id: 'store-b-original', customerId: 'owner', state: 'PREPARED',
    children: [{ storeId: 'b', cartId: 'cart-b', state: 'PREPARED' }] };
  let writes = 0;
  const result = await persistStoreCheckout({ ...input,
    request: async () => { writes++; throw Object.assign(new Error('Cart conflict'), { status: 409 }); },
    lookupCart: async id => {
      lookedUp.push(id);
      if (id === 'cart-a') throw Object.assign(new Error('Not found'), { status: 404 });
      return group;
    },
  });
  assert.equal(result, group);
  assert.deepEqual(lookedUp, ['cart-a', 'cart-b']);
  assert.equal(writes, 0);
  assert.equal(result.children.length, 1);
  assert.ok(input.storage.getItem('checkout-group-attempt'));
});

test('a checkout created between preflight and POST is recovered after conflict', async () => {
  const input = fixture();
  const group = { id: 'racing-group', customerId: 'owner', state: 'RESERVING',
    children: [{ storeId: 'a', cartId: 'cart-a' }] };
  let posted = false;
  const result = await persistStoreCheckout({ ...input,
    lookupCart: async () => {
      if (!posted) throw Object.assign(new Error('Not found'), { status: 404 });
      return group;
    },
    request: async () => { posted = true; throw Object.assign(new Error('Conflict'), { status: 409 }); },
  });
  assert.equal(result, group);
});

test('unavailable saved-checkout lookup prevents a potentially duplicate POST', async () => {
  const input = fixture();
  await assert.rejects(persistStoreCheckout({ ...input,
    lookupCart: async () => { throw Object.assign(new Error('Checkout lookup unavailable'), { status: 503 }); },
    request: async () => assert.fail('Do not submit while checkout ownership is unknown'),
  }), /lookup unavailable/);
});
