`import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryProducts, isGlobalProduct } from './storeDelivery.js';
import { balancedStoreProductPreview } from './storeProductListings.js';

test('preview includes nearby stores and global offers without changing prices', () => {
  const rows = ['a', 'b', 'global-store'].flatMap((storeId) => [1,2,3].map((id) => ({ id, storeId, price: id * 100, fulfillmentType: storeId === 'global-store' ? 'global' : 'nearby' })));
  const preview = balancedStoreProductPreview(rows);
  assert.deepEqual(preview.map((item) => item.storeId), ['a','b','global-store','a','b','global-store']);
  assert.equal(preview[2].price, 100);
});

test('global API flag retains India-wide offer beside a local offer', () => {
  const product = { id: 'p1', title: 'Test product', globalProduct: true, price: 100 };
  assert.equal(isGlobalProduct(product), true);
  const stores = [{ id: 'local', name: 'Local', active: true, latitude: 17, longitude: 78, deliveryRadiusKm: 10 }];
  const mappings = [{ productId: 'p1', storeId: 'local', product, available: true }];
  const rows = deliveryProducts([product], mappings, stores, { latitude: 17, longitude: 78 });
  assert.deepEqual(rows.map((row) => row.storeId), ['local', 'global-store']);
  assert.equal(rows[1].price, 100);
});
