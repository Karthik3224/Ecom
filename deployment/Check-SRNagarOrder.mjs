import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5184';
const id = 'f0814d4e-fab7-4456-a04c-a973ff1e041c';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(base + '/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Email, Mobile Number or Username' }).fill('storemanagersrnagar');
  await page.locator('input[type=password]').fill('admin123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/store-manager/dashboard');
  const token = await page.evaluate(() => sessionStorage.getItem('authToken'));
  const response = await page.request.get(base + '/order-api/api/v1/orders/' + id, { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(response.status(), 200);
  const order = await response.json();
  assert.equal(order.storeId, 'india-store-1-3');
  await page.goto(base + '/store-manager/orders', { waitUntil: 'domcontentloaded' });
  await page.getByText(order.orderNumber || id, { exact: true }).first().waitFor({ timeout: 60000 });
  console.log(JSON.stringify({ orderId: id, store: order.storeId, status: order.status, managerLogin: 'PASS', managerOrderAccess: 'PASS', managerOrdersPage: 'PASS', statusChanged: false }));
} finally { await browser.close(); }
