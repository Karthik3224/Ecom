import test from 'node:test';
import assert from 'node:assert/strict';
import { uniqueStoreProductListings, uniqueCatalogProducts } from './storeProductListings.js';

test('keeps SR Nagar and Hyderabad offers for the same product', () => {
  const main = { productId: 'pickle', storeId: 'hyd-main', price: 289 };
  const nearby = { productId: 'pickle', storeId: 'sr-nagar', price: 279 };
  assert.deepEqual(uniqueStoreProductListings([main, nearby, { ...main }]), [main, nearby]);
});

test('preserves separate products and global-store offers', () => {
  const items = [{ id: 'one', storeId: 'local' }, { id: 'two', storeId: 'local' }, { id: 'one', storeId: 'global' }];
  assert.deepEqual(uniqueStoreProductListings(items), items);
});

test('category results show one card per product and variant without changing store data', () => {
  const main = { productId: 'pickle', variantId: '500g', storeId: 'hyd', price: 289 };
  const larger = { ...main, variantId: '1kg', price: 500 };
  assert.deepEqual(uniqueCatalogProducts([main, { ...main, storeId: 'sr' }, larger]), [main, larger]);
  assert.equal(uniqueCatalogProducts([main, { ...main, storeId: 'sr' }]).length, 1);
});
