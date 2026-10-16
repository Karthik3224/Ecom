import test from 'node:test';
import assert from 'node:assert/strict';
import { loadManagerOrders } from './managerOrders.js';
test('manager fetch uses assigned store and rereads persisted orders on refresh', async () => {
 let rows = [{ id: 'a', storeId: 'store-a' }];
 const request = async params => { assert.deepEqual(params, { storeId: 'store-a' }); return rows; };
 assert.equal((await loadManagerOrders('store-a', request)).length, 1);
 rows = [...rows, { id: 'b', storeId: 'store-a' }];
 assert.equal((await loadManagerOrders('store-a', request)).length, 2);
});
test('missing store never requests an unscoped order feed', async () => {
 await assert.rejects(loadManagerOrders('', () => assert.fail('unscoped request')), /No store/);
});
test('foreign-store and malformed responses fail closed', async () => {
 await assert.rejects(loadManagerOrders('store-a', async () => [{ storeId: 'store-b' }]), /assignment/);
 await assert.rejects(loadManagerOrders('store-a', async () => ({})), /Unexpected/);
});
test('authorization failure propagates without browser-local fallback', async () => {
 await assert.rejects(loadManagerOrders('store-a', async () => { throw new Error('Forbidden'); }), /Forbidden/);
});
