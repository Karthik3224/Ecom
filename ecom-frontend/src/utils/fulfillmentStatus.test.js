import { test } from 'node:test';
import assert from 'node:assert/strict';
import { customerDeliveryStatus } from './fulfillmentStatus.js';

test('terminal persisted order state takes precedence over delayed shipment snapshot', () => {
  assert.equal(customerDeliveryStatus({ order: { status: 'CANCELLED' }, shipment: { status: 'IN_TRANSIT' } }), 'Cancelled');
  assert.equal(customerDeliveryStatus({ order: { status: 'DELIVERED' }, shipment: { status: 'OUT_FOR_DELIVERY' } }), 'Delivered');
});
test('active tracking uses actual shipment then preparation then order state', () => {
  assert.equal(customerDeliveryStatus({ order: { status: 'PROCESSING' }, shipment: { status: 'OUT_FOR_DELIVERY' } }), 'Out for Delivery');
  assert.equal(customerDeliveryStatus({ fulfillment: { status: 'PACKING' } }), 'Preparing');
  assert.equal(customerDeliveryStatus({ order: { status: 'CONFIRMED' } }), 'Confirmed');
});
test('saved acceptance is visible until delivery progresses and cannot override a final status', () => {
  const trackingEvents=[{description:'Assignment accepted by delivery partner.'}];
  assert.equal(customerDeliveryStatus({shipment:{status:'IN_TRANSIT'},trackingEvents}),'Delivery partner accepted');
  assert.equal(customerDeliveryStatus({shipment:{status:'OUT_FOR_DELIVERY'},trackingEvents}),'Out for Delivery');
  assert.equal(customerDeliveryStatus({order:{status:'DELIVERED'},shipment:{status:'IN_TRANSIT'},trackingEvents}),'Delivered');
});
