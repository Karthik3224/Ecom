import test from 'node:test';
import assert from 'node:assert/strict';
import { requirePaymentProcessing } from './paymentAvailability.js';

test('unconfigured or missing payment capabilities fail closed', async () => {
  await assert.rejects(requirePaymentProcessing(async () => ({ processingEnabled: false, reason: 'Provider unavailable' })), /Provider unavailable/);
  await assert.rejects(requirePaymentProcessing(async () => ({})), /unavailable/);
  await assert.rejects(requirePaymentProcessing(async () => ({ processingEnabled: 'true' })), /unavailable/);
});

test('unavailable capability service cannot enable payment processing', async () => {
  await assert.rejects(requirePaymentProcessing(async () => { throw new Error('Network timeout'); }), /Network timeout/);
});
