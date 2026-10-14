import test from 'node:test';
import assert from 'node:assert/strict';
import { storeFulfillmentMethod, pickupDeliveryLine } from './storeFulfillment.js';
test('mixed cart keeps global delivery and local pickup independent', () => {
  const choices={'global-store':'pickup','sr-nagar':'pickup'};
  assert.equal(storeFulfillmentMethod({id:'global-store'},choices),'global');
  assert.equal(storeFulfillmentMethod({id:'sr-nagar'},choices),'pickup');
  assert.equal(storeFulfillmentMethod({id:'hyderabad'},choices),'standard');
  const line=pickupDeliveryLine({storeId:'sr-nagar',deliveryCharge:50,fulfillmentType:'nearby'});
  assert.equal(line.deliveryCharge,0);
  assert.equal(line.deliveryType,'pickup');
  assert.equal(line.storeId,'sr-nagar');
});
