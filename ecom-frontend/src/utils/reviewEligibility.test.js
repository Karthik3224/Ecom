import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewEligible } from './reviewEligibility.js';
test('only authoritative delivered orders are eligible', () => {
 assert.equal(reviewEligible({ status: 'DELIVERED' }), true);
 for (const status of ['CREATED','CONFIRMED','PROCESSING','SHIPPED','CANCELLED',undefined]) assert.equal(reviewEligible({ status, shipment: { status: 'DELIVERED' } }), false);
 assert.equal(reviewEligible(null), false);
});
