import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryBaseUrl } from './inventoryConfig.js';

test('inventory uses the VPS service proxy and preserves overrides', () => {
  assert.equal(inventoryBaseUrl(), '/inventory-service');
  assert.equal(inventoryBaseUrl({ VITE_API_BASE_URL: 'https://gateway/' }), 'https://gateway/inventory-service');
  assert.equal(inventoryBaseUrl({ VITE_INVENTORY_URL: '/custom/', VITE_API_BASE_URL: 'https://gateway' }), '/custom');
});
