import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogBaseUrl } from './catalogConfig.js';

test('catalog requests use the configured gateway service prefix', () => {
  assert.equal(catalogBaseUrl({ VITE_API_BASE_URL: 'http://187.126.118.203:8082/' }) + '/api/v1/products', 'http://187.126.118.203:8082/catalog-service/api/v1/products');
  assert.equal(catalogBaseUrl({ VITE_API_BASE_URL: 'https://gateway', VITE_CATALOG_URL: '/custom/' }), '/custom');
  assert.equal(catalogBaseUrl(), '/catalog');
});
