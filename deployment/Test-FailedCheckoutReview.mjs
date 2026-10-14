import { createRequire } from 'node:module';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes = fs.readFileSync('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    await page.goto('http://127.0.0.1:5184/login');
    await page.getByRole('textbox', { name: /^Email/ }).fill(fixture.email);
    await page.locator('input[type=password]').fill('LocalQaOnly9');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL('**/home');
    const id = randomUUID();
    const children = ['a', 'b'].map(storeId => ({ storeId, cartId: randomUUID(), orderId: null, state: 'RELEASED', handlingFee: 5 }));
    const group = { id, customerId: fixture.customerId, state: 'FAILED', children, recoveryRequired: false };
    let reads = 0;
    await page.route('**/order-api/api/v1/checkouts/' + id, route => { reads++; return route.fulfill({ json: group }); });
    await page.evaluate(({ group }) => {
      for (const child of group.children) sessionStorage.setItem(`checkout-cart:${group.customerId}:${child.storeId}`, JSON.stringify({ cartId: child.cartId }));
      const stores = group.children.map(child => ({ storeId: child.storeId, cartId: child.cartId, customerId: group.customerId }));
      sessionStorage.setItem('checkout-group-attempt', JSON.stringify({ key: 'failed-attempt', body: JSON.stringify({ stores }) }));
      sessionStorage.setItem('unrelated-review-test', 'keep');
    }, { group });
    const writes = [];
    page.on('request', request => { if (/\/(order-api|cart-api|inventory|payments)\//.test(request.url()) && request.method() !== 'GET') writes.push(request.url()); });
    await page.goto('http://127.0.0.1:5184/checkout-group/' + id);
    await page.getByRole('heading', { name: 'Checkout unsuccessful', exact: true }).waitFor();
    assert.equal(await page.getByText('Handling not charged', { exact: true }).count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Review Cart & Retry', exact: true }).click();
    await page.waitForURL('**/cart');
    assert.ok(reads >= 2, 'Fresh backend status required before reset');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('checkout-group-attempt')), null);
    for (const child of children) assert.equal(await page.evaluate(key => sessionStorage.getItem(key), `checkout-cart:${fixture.customerId}:${child.storeId}`), null);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('unrelated-review-test')), 'keep');
    assert.deepEqual(writes, []);
    console.log(`PASS controlled failed-checkout review ${width}: fresh read, owner-scoped metadata reset, no DB/stock writes`);
    await context.close();
  }
} finally { await browser.close(); }
