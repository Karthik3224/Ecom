import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';

const require = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json');
const { chromium } = require('playwright');
const base = 'http://127.0.0.1:5184';
const uuid = execFileSync('C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe', ['--no-defaults', '--host=127.0.0.1', '--port=14306', '--user=root', '--connect-timeout=5', '--batch', '--skip-column-names', '--execute=SELECT @@server_uuid'], { encoding: 'utf8', timeout: 15000 }).trim();
console.log('Isolated MySQL identity verified');
assert.equal(uuid, '580d1315-c4bf-11f1-bf4b-14cb19888cfa', 'Only approved isolated MySQL');
const fixtureBytes = await readFile('.local/isolated-login-fixture.json');
const fixture = JSON.parse(fixtureBytes.toString(fixtureBytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const output = '.local/tracking-browser-latest';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/login');
    await page.screenshot({ path: `${output}/login-${viewport.width}.png`, fullPage: true });
    await writeFile(`${output}/login-diagnostic-${viewport.width}.json`, JSON.stringify({ url: page.url(), text: await page.locator('body').innerText(), errors }, null, 2));
    await page.getByRole('textbox', { name: /^Email/ }).fill(fixture.email);
    await page.locator('input[type="password"]').fill('LocalQaOnly9');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL('**/home', { timeout: 60000 });
    console.log(`Browser login PASS ${viewport.width}`);
    const token = await page.evaluate(() => sessionStorage.getItem('authToken'));
    assert.ok(token, 'Actual browser login must provide a token');
    const history = await context.request.get(base + '/order-api/api/v1/orders/customer/' + fixture.customerId, { timeout: 15000, headers: { Authorization: 'Bearer ' + token } });
    assert.equal(history.status(), 200);
    let orders = await history.json();
    console.log(`Owned order count ${orders.length}`);
    if (!orders.length || viewport.width === 1440) {
      const headers = { Authorization: 'Bearer ' + token, 'Idempotency-Key': randomUUID() };
      const mappings = await (await context.request.get(base + '/catalog/api/v1/store-products')).json();
      let selection;
      for (const mapping of mappings.filter(entry => entry.available)) {
        const store = await (await context.request.get(base + '/catalog/api/v1/stores/' + mapping.storeId)).json();
        if (!store.active || !store.pickupEnabled || store.status !== 'Active') continue;
        const product = await (await context.request.get(base + '/catalog/api/v1/products/' + mapping.productId)).json();
        const variant = product.variants?.find(entry => entry.active && entry.price > 0);
        if (product.status === 'ACTIVE' && variant) { selection = { mapping, product, variant }; break; }
      }
      assert.ok(selection, 'Real restored pickup catalog fixture required');
      const { mapping, product, variant } = selection;
      const cartResponse = await context.request.post(base + '/cart-api/api/v1/carts', { headers, data: { customerId: fixture.customerId, storeId: mapping.storeId } });
      assert.equal(cartResponse.status(), 201);
      const cart = await cartResponse.json();
      const item = { productId: product.id, variantId: variant.id, productName: product.name, quantity: 1, unitPrice: Number(mapping.priceOverride ?? variant.price) };
      const added = await context.request.post(base + '/cart-api/api/v1/carts/' + cart.id + '/items', { headers, data: item });
      assert.equal(added.status(), 200);
      const payload = { customerId: fixture.customerId, cartId: cart.id, storeId: mapping.storeId, items: [item], deliveryMethod: 'pickup', fulfillmentType: 'pickup' };
      const created = await context.request.post(base + '/order-api/api/v1/orders', { headers, data: payload });
      assert.equal(created.status(), 201, await created.text());
      const order = await created.json();
      const duplicate = await context.request.post(base + '/order-api/api/v1/orders', { headers, data: payload });
      assert.equal((await duplicate.json()).id, order.id, 'Duplicate request must preserve order');
      orders = [order];
    }
    await page.goto(base + '/orders');
    await page.screenshot({ path: `${output}/history-${viewport.width}.png`, fullPage: true });
    if (orders.length) {
      const order = orders[0];
      let paymentMutations = 0;
      const watchPayment = request => {
        if (request.method() === 'POST' && request.url().includes('/payment-api/')) paymentMutations++;
      };
      page.on('request', watchPayment);
      await page.evaluate(orderId => {
        history.pushState({ usr: { orderId }, key: 'saved-payment-demo' }, '', '/payment-options');
      }, order.id);
      await page.reload();
      await page.getByRole('button', { name: /^Pay / }).click();
      await page.getByRole('heading', { name: 'Order Saved', exact: true }).waitFor();
      assert.ok((await page.locator('body').innerText()).includes('Payment status: ' + order.paymentStatus));
      assert.equal(paymentMutations, 0, 'Demo must not create a payment');
      await page.getByRole('button', { name: 'View Order Details & Tracking', exact: true }).click();
      await page.waitForURL('**/order-details/' + order.id);
      await page.goto(base + '/orders');
      page.off('request', watchPayment);
      console.log(`Saved-order demo payment navigation PASS ${viewport.width}; no payment POST`);
      const invalid = await context.request.get(base + '/order-api/api/v1/orders/' + order.id, { timeout: 15000, headers: { Authorization: 'Bearer ' + token + 'invalid' } });
      assert.equal(invalid.status(), 401, 'Tampered JWT must be rejected');
      const forged = await context.request.patch(base + '/order-api/api/v1/orders/' + order.id + '/status', { timeout: 15000, headers: { Authorization: 'Bearer ' + token }, data: { status: 'DELIVERED' } });
      assert.equal(forged.status(), 403, 'Owner cannot forge status');
      await page.getByRole('button', { name: 'View order ' + order.id, exact: true }).click();
      await page.waitForURL('**/order-details/' + order.id);
      await page.getByRole('button', { name: 'Back to previous page', exact: true }).click();
      await page.waitForURL('**/orders');
      await page.getByRole('button', { name: 'View order ' + order.id, exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.getByText('Total Order Price', { exact: true }).waitFor({ timeout: 60000 });
      assert.ok((await page.locator('body').innerText()).includes(order.id));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
      await page.screenshot({ path: `${output}/details-${viewport.width}.png`, fullPage: true });
      await page.getByText('Delivery Tracking', { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/tracking-${viewport.width}.png` });
      let synchronization = 'NOT RUN: no eligible status transition';
      if (['CREATED', 'CONFIRMED', 'PROCESSING'].includes(order.status)) {
        const nextStatus = order.status === 'CREATED' ? 'CONFIRMED' : 'PROCESSING';
        const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
        const now = Math.floor(Date.now() / 1000);
        const unsigned = part({ alg: 'HS512', typ: 'JWT' }) + '.' + part({ sub: 'isolated-admin', iss: 'org-access', iat: now, exp: now + 300, accountType: 'staff', roles: ['ROLE_ADMIN'] });
        const admin = unsigned + '.' + createHmac('sha512', 'isolated-qualification-jwt-' + 'x'.repeat(64)).update(unsigned).digest('base64url');
        const updated = await context.request.patch(base + '/order-api/api/v1/orders/' + order.id + '/status', { timeout: 15000, headers: { Authorization: 'Bearer ' + admin }, data: { status: nextStatus } });
        assert.equal(updated.status(), 200);
        assert.equal((await updated.json()).totalAmount, order.totalAmount, 'Status update preserves persisted total');
        await page.locator('.delivered-bold-title').filter({ hasText: 'Order ' + nextStatus }).waitFor({ timeout: 30000 });
        synchronization = order.status === nextStatus ? 'PASS: repeated admin update preserved status and total' : 'PASS: admin persisted status and customer browser updated by polling';
        await page.screenshot({ path: `${output}/updated-${viewport.width}.png`, fullPage: true });
      }
      results.push({ viewport, actualLogin: 'PASS', ownerDetails: 'PASS', historyDetailsBackNavigation: 'PASS: click, back and keyboard Enter', synchronization, orderId: order.id, errors });
      const orderPath = base + '/order-api/api/v1/orders/' + order.id;
      let terminalReads = 0;
      await page.route(orderPath, async route => {
        terminalReads++;
        await route.fulfill({ json: { ...order, status: 'DELIVERED', customerLatitude: null, customerLongitude: null, storeLatitude: null, storeLongitude: null } });
      });
      await page.goto(base + '/order-details/' + order.id);
      await page.locator('.delivered-bold-title').filter({ hasText: 'Order DELIVERED' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Cancel Order', exact: true }).count(), 0);
      await page.getByText('Map locations are not recorded for this order.', { exact: true }).waitFor();
      await page.waitForTimeout(11000);
      assert.equal(terminalReads, 1, 'Terminal order must stop automatic order polling');
      await page.screenshot({ path: `${output}/terminal-${viewport.width}.png` });
      await page.unroute(orderPath);
      await page.route(orderPath, route => route.fulfill({ status: 503, json: { message: 'Controlled API failure' } }));
      await page.goto(base + '/order-details/' + order.id);
      await page.getByRole('alert').filter({ hasText: 'Order Service is unavailable' }).waitFor();
      await page.screenshot({ path: `${output}/api-error-${viewport.width}.png` });
      await page.unroute(orderPath);
      results.at(-1).fixtureStates = 'PASS: missing coordinates, terminal cancellation hidden, terminal polling stopped, API 503 fallback';
      await page.route(orderPath, route => route.abort('internetdisconnected'));
      await page.goto(base + '/order-details/' + order.id);
      await page.getByRole('alert').filter({ hasText: 'Order Service is unavailable' }).waitFor();
      await page.unroute(orderPath);
      await page.route(orderPath, async route => {
        await new Promise(resolve => setTimeout(resolve, 2500));
        await route.fulfill({ status: 503, json: { message: 'Controlled delayed failure' } });
      });
      await page.goto(base + '/order-details/' + order.id);
      await page.getByRole('status').filter({ hasText: 'Loading order details' }).waitFor();
      await page.getByRole('alert').filter({ hasText: 'Order Service is unavailable' }).waitFor();
      await page.unroute(orderPath);
      await page.route(orderPath, route => route.fulfill({ status: 401, json: { message: 'Expired session fixture' } }));
      await page.goto(base + '/order-details/' + order.id);
      await page.waitForFunction(() => !sessionStorage.getItem('authToken'));
      await page.unroute(orderPath);
      results.at(-1).fixtureStates += '; offline, loading and 401 session removal';
    } else {
      results.push({ viewport, actualLogin: 'PASS', ownerDetails: 'NOT VERIFIED: no owned test orders', errors });
    }
    assert.deepEqual(errors, [], 'Browser runtime exceptions');
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(output + '/results.json', JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results, null, 2));
