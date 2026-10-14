import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPersistedPayment } from './persistedPayment.js';
const payment = { id: '11111111-1111-4111-8111-111111111111', orderId: 'order', customerId: 'owner', amount: '234.00', status: 'PENDING' };
test('saved payment UID remains pending rather than pretending demo settlement', () => {
  assert.equal(verifyPersistedPayment(payment, 'order', 'owner', 234).status, 'PENDING');
});
test('foreign order, owner, amount and browser demo IDs cannot be displayed as database payments', () => {
  for (const changed of [{ orderId: 'other' }, { customerId: 'other' }, { amount: 1 }, { id: 'DEMO-PAYMENT-1' }, { status: 'SIMULATED' }]) {
    assert.throws(() => verifyPersistedPayment({ ...payment, ...changed }, 'order', 'owner', 234), /does not match/);
  }
});
