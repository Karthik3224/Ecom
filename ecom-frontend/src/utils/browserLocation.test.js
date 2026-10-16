import test from 'node:test';
import assert from 'node:assert/strict';
import { browserLocation } from './browserLocation.js';
test('insecure and unsupported location have manual fallbacks', async () => {
 await assert.rejects(browserLocation({ isSecureContext: false }), /HTTPS/);
 await assert.rejects(browserLocation({ navigator: {} }), /manually/);
});
test('blocked location does not trigger a browser prompt', async () => {
 await assert.rejects(browserLocation({ navigator: { permissions: { query: async () => ({state:'denied'}) }, geolocation: {getCurrentPosition: () => assert.fail('blocked prompt')} } }), /blocked/);
});
test('granted location uses actual coordinates', async () => {
 assert.deepEqual(await browserLocation({navigator:{geolocation:{getCurrentPosition: success => success({coords:{latitude:17,longitude:78}})}}}),{lat:17,lng:78});
});
test('dismissed or failed request does not report success', async () => {
 await assert.rejects(browserLocation({navigator:{geolocation:{getCurrentPosition: (_,fail) => fail({code:1})}}}), /not granted/);
});
