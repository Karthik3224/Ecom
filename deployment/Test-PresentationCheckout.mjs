import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes = await readFile('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
await mkdir('.local/presentation-checkout', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const items = ['a', 'b'].map((storeId, index) => ({ id: storeId, productId: `presentation-${index}`, storeId, title: 'Presentation item', unitPrice: 169, price: 169, quantity: 1 }));
    await page.route('**/cart-api/**', route => route.fulfill({ json: { id: 'presentation-cart', storeId: 'a', status: 'ACTIVE', items } }));
    await page.goto('http://127.0.0.1:5184/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: /^Email/ }).fill(fixture.email);
    await page.locator('input[type="password"]').fill('LocalQaOnly9');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL('**/home');
    await page.evaluate((items) => {
      localStorage.setItem('guestCartItems', JSON.stringify(items));
      history.pushState({ usr: { checkout: { deliveryFee: 110, handlingFee: 5, total: 453, deliveryAddress: 'Presentation address', deliveryLines: items.map((item, index) => ({ storeId: item.storeId, productId: item.productId, deliveryCharge: index ? 50 : 60, storeName: `Presentation Store ${index + 1}` })) } } }, '', '/payment-options');
    }, items);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const button = page.getByRole('button', { name: /Simulate Checkout/ });
    await button.waitFor();
    assert.match(await button.innerText(), /458/);
    assert.equal(await button.isEnabled(), true);
    await page.getByRole('heading', { name: 'UPI Demo Payment', exact: true }).waitFor();
    assert.equal(await page.getByText('Local client demo only.', { exact: true }).count(), 0);
    const writes = [];
    page.on('request', request => { if (/\/(order-api|payment-api)\//.test(request.url()) && request.method() !== 'GET') writes.push(request.url()); });
    await button.click();
    await page.getByRole('heading', { name: 'Demo Payment Completed', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'View Order Details', exact: true }).count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `.local/presentation-checkout/${width}-success.png`, fullPage: true });
    await page.getByRole('button', { name: 'View Order Details', exact: true }).first().click();
    await page.getByRole('dialog').waitFor();
    // Exercise the actual demo tracking utility, not the secured backend manager flow.
    await page.evaluate(async () => {
      const { listManagerDemoOrders, advanceManagerDemoOrder } = await import('/src/utils/demoTracking.js');
      const checkout = JSON.parse(Object.entries(localStorage).find(([key]) => key.startsWith('spices:demo-checkout:'))[1]).result;
      const order = checkout.orders[0];
      const actor = { id: 'presentation-manager', role: 'store-manager', storeId: order.storeId };
      const assigned = listManagerDemoOrders(localStorage, actor);
      if (!assigned.some(row => row.id === order.id && row.paymentId === checkout.paymentId)) throw new Error('Missing linked manager demo order');
      advanceManagerDemoOrder(localStorage, actor, checkout.customerId, order.id, 1, Date.now());
      window.dispatchEvent(new Event('demo-tracking-updated'));
    });
    await page.getByRole('status').filter({ hasText: 'Preparing your order' }).waitFor();
    assert.deepEqual(writes, []);
    console.log(`PASS presentation checkout ${width}: linked IDs, manager utility to customer tracking, two stores, total 458, no order/payment writes`);
    await context.close();
  }
} finally { await browser.close(); }
