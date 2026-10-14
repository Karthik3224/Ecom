import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest } from './apiClient.js';

test('401 with a fresh token does not expire the customer session', async () => {
  const previous = { fetch: globalThis.fetch, window: globalThis.window, sessionStorage: globalThis.sessionStorage };
  let event;
  const sessionToken = `test.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString('base64url')}.test`;
  globalThis.sessionStorage = { getItem: () => sessionToken };
  globalThis.window = { dispatchEvent: (value) => { event = value.type; } };
  globalThis.fetch = async () => new Response('', { status: 401 });
  try {
    await assert.rejects(apiRequest('/customer-profile', '/api/v1/profiles/me/addresses', { method: 'POST', body: '{}' }), (error) => error.status === 401 && /permission/.test(error.message));
    assert.equal(event, undefined);
    event = undefined;
    globalThis.fetch = async () => new Response('', { status: 403 });
    await assert.rejects(apiRequest('/customer-profile', '/api/v1/profiles/me/addresses'), (error) => error.status === 403 && /permission/.test(error.message));
    assert.equal(event, undefined);
    globalThis.fetch = async () => new Response('', { status: 401 });
    await assert.rejects(apiRequest('/customer-profile', '/api/v1/profiles/me', { expireSession: false }));
    assert.equal(event, undefined);
    let token = 'old-session';
    globalThis.sessionStorage = { getItem: () => token };
    globalThis.fetch = async () => { token = 'new-session'; return new Response('', { status: 401 }); };
    await assert.rejects(apiRequest('/customer-profile', '/api/v1/profiles/me'));
    assert.equal(event, undefined);
  } finally { Object.assign(globalThis, previous); }
});

test('401 with a stale token expires the customer session', async () => {
  const previous = { fetch: globalThis.fetch, window: globalThis.window, sessionStorage: globalThis.sessionStorage };
  let event;
  const expiredToken = `test.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 - 60 })).toString('base64url')}.test`;
  globalThis.sessionStorage = { getItem: () => expiredToken };
  globalThis.window = { dispatchEvent: (value) => { event = value.type; } };
  globalThis.fetch = async () => new Response('', { status: 401 });
  try {
    await assert.rejects(apiRequest('/customer-profile', '/api/v1/profiles/me/addresses'), (error) => error.status === 401 && /session is no longer valid/.test(error.message));
    assert.equal(event, 'customer-session-expired');
  } finally { Object.assign(globalThis, previous); }
});
import { Buffer } from 'node:buffer';
