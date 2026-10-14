import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutPolicyError, checkoutReviewError } from './checkoutPolicy.js';

test('multi-store carts may reach payment review without enabling order creation', () => {
  assert.equal(checkoutReviewError({ groupCount: 2, handlingFee: 5 }), '');
  assert.notEqual(checkoutPolicyError({ groupCount: 2, handlingFee: 5 }), '');
  assert.notEqual(checkoutReviewError({ groupCount: 0 }), '');
  assert.notEqual(checkoutReviewError({ groupCount: 2, handlingFee: NaN }), '');
});

test('single verified group with supported totals may proceed', () => {
  assert.equal(checkoutPolicyError({ groupCount: 1 }), '');
});
test('mixed and multi-store checkout is blocked before creation', () => {
  assert.match(checkoutPolicyError({ groupCount: 2 }), /separate orders/);
  assert.match(checkoutPolicyError({ groupCount: 3 }), /separate orders/);
});
test('unsupported handling and coupon totals fail closed', () => {
  assert.equal(checkoutPolicyError({ groupCount: 1, handlingFee: 5 }), '');
  for (const totals of [{ handlingFee: 7 }, { discount: 10 }, { coupon: 'SAVE10' }]) {
    assert.match(checkoutPolicyError({ groupCount: 1, ...totals }), /order service/);
  }
});
test('missing delivery groups and malformed totals cannot proceed', () => {
  assert.notEqual(checkoutPolicyError({ groupCount: 0 }), '');
  assert.notEqual(checkoutPolicyError({ groupCount: 1, handlingFee: 'invalid' }), '');
});
