import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totalDeliveryCharge } from './deliveryCharges.js';

test('charges once per store, not once per item or quantity', () => {
  assert.equal(totalDeliveryCharge([
    { storeId: 'a', deliveryCharge: 50, quantity: 3 },
    { storeId: 'a', deliveryCharge: 50 },
    { storeId: 'b', deliveryCharge: 20 },
  ]), 70);
});
test('global lines and free delivery do not add local fees', () => {
  assert.equal(totalDeliveryCharge([{ storeId: 'a', deliveryCharge: 0 }, { fulfillmentType: 'global', deliveryCharge: 50 }]), 0);
});
test('invalid fees cannot contaminate the checkout total', () => {
  assert.throws(() => totalDeliveryCharge([{ storeId: 'a', deliveryCharge: -1 }]));
  assert.throws(() => totalDeliveryCharge([{ storeId: 'a', deliveryCharge: 'invalid' }]));
});
