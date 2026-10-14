import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes = fs.readFileSync('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const response = await fetch('http://127.0.0.1:5184/org-access/api/auth/customer/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fixture.email, password: 'LocalQaOnly9' }) });
assert.equal(response.status, 200);
const session = await response.json();
const saved = JSON.parse(fs.readFileSync('.local/delivery-browser-20261012/browser.json', 'utf8'));
const orderId = saved[0].group.children[0].orderId;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.addInitScript(({ user, token }) => {
    if (location.origin !== 'http://127.0.0.1:5184') return;
    sessionStorage.setItem('user', JSON.stringify(user)); sessionStorage.setItem('authToken', token); sessionStorage.setItem('isLoggedIn', 'true');
  }, session);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:5184/order-details/' + orderId, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Order status', exact: true }).waitFor();
    assert.equal(await page.getByText('Order preparation', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Shipment status', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Tracking Timeline', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Tracking number', { exact: true }).count(), 0);
    await page.getByRole('region', { name: 'Order tracking status' }).getByRole('button', { name: 'Refresh', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log(`PASS one customer order-status panel without extra tracking fields at ${width}px`);
  }
} finally { await browser.close(); }
