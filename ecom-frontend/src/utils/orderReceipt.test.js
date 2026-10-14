import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptRows, verifiedPaymentLabel } from './orderReceipt.js';
test('receipt preserves server charges and does not invent missing tax', () => {
  assert.deepEqual(receiptRows({ subtotal: 100, handlingFee: 5, taxAmount: null }), [{ label: 'Item subtotal', amount: 100 }, { label: 'Handling fee', amount: 5 }]);
});
test('absent or unknown payment never displays a paid confirmation', () => {
  assert.equal(verifiedPaymentLabel(null), 'Payment confirmation unavailable');
  assert.equal(verifiedPaymentLabel({ status: 'DEMO_SUCCESS' }), 'Payment confirmation unavailable');
  assert.equal(verifiedPaymentLabel({ status: 'PENDING' }), 'Payment pending');
});
