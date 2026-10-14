import test from 'node:test';
import assert from 'node:assert/strict';
import { shipmentRequest } from './shipmentRequest.js';
test('shipment uses recorded estimate and leaves reference generation to backend', () => {
  const result = shipmentRequest({ createdAt: '2026-10-12T09:00:00Z', estimatedDeliveryMax: 30 }, { id: 'saved-fulfillment' });
  assert.equal(result.estimatedDeliveryDate, '2026-10-12');
  assert.equal(result.fulfillmentId, 'saved-fulfillment');
  assert.equal(result.carrier, 'Store Delivery');
  assert.equal('trackingNumber' in result, false);
});
test('scheduled date is preserved and absent estimate is not invented', () => {
  assert.equal(shipmentRequest({ scheduledDeliveryDate: '2026-10-15' }, { id: 'saved' }).estimatedDeliveryDate, '2026-10-15');
  for (const order of [{}, { createdAt: 'invalid', estimatedDeliveryMax: 30 }, { createdAt: '2026-10-12', estimatedDeliveryMax: 0 }]) {
    assert.throws(() => shipmentRequest(order, { id: 'saved' }), /delivery estimate/);
  }
});
