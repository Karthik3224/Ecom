import test from 'node:test';
import assert from 'node:assert/strict';
import { serviceBaseUrl } from './apiConfig.js';

test('checkout uses the configured backend gateway', () => {
  assert.equal(serviceBaseUrl({ VITE_API_BASE_URL: 'http://187.126.118.203:8082///' }, 'VITE_ORDER_URL', '/order-api') + '/api/v1/checkouts',
    'http://187.126.118.203:8082/order-api/api/v1/checkouts');
});
test('service overrides and development proxy fallback remain supported', () => {
  assert.equal(serviceBaseUrl({ VITE_API_BASE_URL: 'https://gateway', VITE_ORDER_URL: 'https://orders/' }, 'VITE_ORDER_URL', '/order-api'), 'https://orders');
  assert.equal(serviceBaseUrl({}, 'VITE_ORDER_URL', '/order-api'), '/order-api');
});