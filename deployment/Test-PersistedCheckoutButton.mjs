import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes = await readFile('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const base = process.env.CHECKOUT_BROWSER_URL || 'http://127.0.0.1:5186';
await mkdir('.local/persisted-button-browser', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [width, storeCount] of [[1440, 1], [390, 1], [1440, 2], [390, 2]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const productId = randomUUID();
    const items = ['a', 'b'].slice(0, storeCount).map(storeId => ({ id: randomUUID(), productId, storeId, title: 'Qualification item', unitPrice: 169, price: 169, quantity: 1 }));
    await page.route('**/catalog/**', route => route.fulfill({ json: [] }));
    const carts = items.map(item => ({ id: randomUUID(), storeId: item.storeId, customerId: fixture.customerId, status: 'ACTIVE', items: [item] }));
    await page.route('**/inventory/api/v1/inventories?*', route => {
      const query = new URL(route.request().url()).searchParams;
      return route.fulfill({ json: { storeId: query.get('storeId'), productId: query.get('productId'), variantId: null, status: 'ACTIVE', availableQuantity: 10 } });
    });
    await page.route('**/cart-api/**', route => {
      const url = new URL(route.request().url());
      const cart = carts.find(entry => entry.id === url.pathname.split('/').at(-1) || entry.storeId === url.searchParams.get('storeId'));
      return route.fulfill({ json: cart || { ...carts[0], items } });
    });
    const groupId = randomUUID();
    const children = carts.map(cart => ({ storeId: cart.storeId, cartId: cart.id, orderId: randomUUID(), state: 'CONFIRMED', handlingFee: 5, subtotal: 169, deliveryFee: 0, total: 174, orderStatus: 'CREATED', paymentStatus: 'PENDING' }));
    const group = { id: groupId, customerId: fixture.customerId, state: 'COMPLETED', aggregateTotal: 174 * storeCount, children };
    const submissions = [];
    await page.route('**/order-api/**', route => route.fulfill({ json: [] }));
    await page.route('**/customer-profile/**', route => route.fulfill({ json: [] }));
    await page.route('**/order-api/api/v1/checkouts', route => {
      const request = route.request();
      submissions.push({ body: request.postDataJSON(), key: request.headers()['idempotency-key'] });
      return route.fulfill({ json: { ...group, state: 'RESERVING', aggregateTotal: null, children: children.map(child => ({ ...child, orderId: null, state: 'PENDING', total: null })) } });
    });
    await page.route('**/order-api/api/v1/checkouts/' + groupId, route => route.fulfill({ json: group }));
    const payments = children.map(child => ({ id: randomUUID(), orderId: child.orderId, customerId: fixture.customerId, amount: child.total, status: 'PENDING' }));
    await page.route('**/payments/api/v1/payments/order/*', route => route.fulfill({ json: payments.find(payment => route.request().url().endsWith(payment.orderId)) }));
    await context.addInitScript(({ items, owner }) => {
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('authToken', 'controlled.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.controlled');
      sessionStorage.setItem('user', JSON.stringify({ id: owner, name: 'Controlled checkout customer', role: 'customer' }));
      localStorage.setItem('guestCartItems', JSON.stringify(items));
      if (location.pathname === '/payment-options') history.replaceState({ usr: { checkout: { method: 'pickup', deliveryFee: 0, handlingFee: 5, total: items.length * 169 + 5, deliveryAddress: 'Qualification address', deliveryLines: items.map(item => ({ storeId: item.storeId, productId: item.productId, deliveryCharge: 0 })) } } }, '', location.href);
    }, { items, owner: fixture.customerId });
    await page.goto(base + '/payment-options', { waitUntil: 'domcontentloaded' });
    const pay = page.getByRole('button', { name: /^Pay / });
    await pay.waitFor();
    assert.ok((await pay.innerText()).includes(String(174 * storeCount)));
    await pay.click();
    await page.waitForURL('**/checkout-group/' + groupId);
    await page.getByRole('heading', { name: 'Orders saved', exact: true }).waitFor();
    assert.equal(submissions.length, 1);
    assert.ok(submissions[0].key);
    assert.deepEqual(submissions[0].body.stores.map(store => store.storeId), ['a', 'b'].slice(0, storeCount));
    assert.deepEqual(submissions[0].body.stores.map(store => store.cartId), carts.map(cart => cart.id));
    for (const payment of payments) await page.getByText('Payment UID: ' + payment.id, { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'View Order Details & Tracking', exact: true }).count(), storeCount);
    assert.equal(await page.getByRole('heading', { name: 'Demo Payment Completed', exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `.local/persisted-button-browser/${width}-${storeCount}-stores.png`, fullPage: true });
    console.log(`PASS controlled persisted Pay wiring ${width}, ${storeCount} stores: per-store carts, one group POST, pending payment UIDs; NOT database persistence evidence`);
    await context.close();
  }
} finally { await browser.close(); }
