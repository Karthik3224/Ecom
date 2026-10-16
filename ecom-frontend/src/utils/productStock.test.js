import test from 'node:test';
import assert from 'node:assert/strict';
import { loadProductStock } from './productStock.js';
import { apiRequest } from '../services/apiClient.js';
import { inventoryBaseUrl } from '../services/inventoryConfig.js';

const identity = { productId: 'product', variantId: 'variant', storeId: 'store' };
const row = { ...identity, availableQuantity: 7, reservedQuantity: 2, status: 'ACTIVE' };

test('inventory routing honors gateway, override, and local proxy', () => {
  assert.equal(inventoryBaseUrl({ VITE_API_BASE_URL: 'http://187.126.118.203:8082/' }), 'http://187.126.118.203:8082/inventory-service');
  assert.equal(inventoryBaseUrl({ VITE_API_BASE_URL: 'https://gateway', VITE_INVENTORY_URL: '/custom/' }), '/custom');
  assert.equal(inventoryBaseUrl(), '/inventory-service');
});
test('available stock uses availableQuantity without subtracting reserved stock again', async () => {
  assert.deepEqual(await loadProductStock(async () => row, identity), { state: 'available', available: 7 });
});
test('zero stock and inactive stock are confirmed non-purchasable', async () => {
  assert.deepEqual(await loadProductStock(async () => ({ ...row, availableQuantity: 0 }), identity), { state: 'out', available: 0 });
  assert.equal((await loadProductStock(async () => ({ ...row, status: 'INACTIVE' }), identity)).state, 'out');
  assert.equal((await loadProductStock(async () => ({ ...row, status: 'OUT_OF_STOCK' }), identity)).state, 'out');
});
test('missing inventory is distinct from a failed request and zero stock', async () => {
  assert.deepEqual(await loadProductStock(async () => { throw Object.assign(new Error(), { status: 404 }); }, identity), { state: 'missing' });
});
test('a failed request affects only its card and never invents a zero quantity', async () => {
  const results = await Promise.all([
    loadProductStock(async () => { throw Object.assign(new Error(), { status: 502 }); }, identity),
    loadProductStock(async () => row, identity),
  ]);
  assert.deepEqual(results, [{ state: 'error' }, { state: 'available', available: 7 }]);
});
test('mismatched identities and invalid quantities cannot claim availability', async () => {
  for (const patch of [{ storeId: 'other' }, { productId: 'other' }, { variantId: 'other' }, { availableQuantity: undefined }, { availableQuantity: -1 }, { status: 'UNKNOWN' }]) {
    assert.deepEqual(await loadProductStock(async () => ({ ...row, ...patch }), identity), { state: 'error' });
  }
});
test('inventory requests retain the session Bearer token and distinguish server/auth errors', async () => {
  const previous = { fetch: globalThis.fetch, sessionStorage: globalThis.sessionStorage };
  globalThis.sessionStorage = { getItem: () => 'session-token' };
  try {
    for (const status of [200, 502, 403]) {
      globalThis.fetch = async (url, options) => {
        assert.equal(url, 'https://gateway/inventory-service/api/v1/inventories?productId=product&storeId=store');
        assert.equal(options.headers.Authorization, 'Bearer session-token');
        return new Response(JSON.stringify(status === 200 ? row : { message: 'Request failed' }), { status });
      };
      const result = await loadProductStock(() => apiRequest('https://gateway/inventory-service', '/api/v1/inventories?productId=product&storeId=store', { expireSession: false }), identity);
      assert.equal(result.state, status === 200 ? 'available' : 'error');
    }
  } finally { Object.assign(globalThis, previous); }
});
