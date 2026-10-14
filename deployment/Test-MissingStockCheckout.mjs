import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes = fs.readFileSync('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.goto('http://127.0.0.1:5184/login');
  await page.getByRole('textbox', { name: /^Email/ }).fill(fixture.email);
  await page.locator('input[type=password]').fill('LocalQaOnly9');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL('**/home');
  await page.evaluate(() => {
    const items = ['india-store-1-3', 'store-banjara'].map(storeId => ({ storeId, id: '21000000-0000-0000-0000-000000000018', productId: '21000000-0000-0000-0000-000000000018', variantId: 'c88eae9d-c3cf-11f1-860d-14cb19888cfa', title: 'Chicken Curry Cut', price: 169, quantity: 1 }));
    localStorage.setItem('guestCartItems', JSON.stringify(items));
    history.pushState({ usr: { checkout: { method: 'instant', deliveryFee: 110, deliveryLines: items.map(item => ({ storeId: item.storeId, productId: item.productId, deliveryCharge: 55 })) } } }, '', '/payment-options');
  });
  const writes = [];
  page.on('request', request => { if (/\/(order-api|cart-api|inventory|payments)\//.test(request.url()) && request.method() !== 'GET') writes.push(request.url()); });
  await page.reload();
  await page.getByRole('button', { name: /^Pay / }).click();
  await page.getByRole('alert').filter({ hasText: 'no stock record at india-store-1-3' }).waitFor();
  await page.getByRole('alert').filter({ hasText: 'no stock record at store-banjara' }).waitFor();
  assert.ok(page.url().endsWith('/payment-options'));
  assert.deepEqual(writes, []);
  console.log('PASS real missing-Chicken inventory preflight: both stores explained; zero cart/order/payment/stock writes');
} finally { await browser.close(); }
