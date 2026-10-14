import { createRequire } from 'node:module';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''));
const delivery = process.env.CHECKOUT_DELIVERY === 'true';
const selections = JSON.parse(fs.readFileSync(`${cfg.run}/fixtures.json`, 'utf8'));
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const base = process.env.CHECKOUT_BROWSER_URL || 'http://127.0.0.1:5185';
const output = process.env.CHECKOUT_BROWSER_OUTPUT || cfg.run;
fs.mkdirSync(output, { recursive: true });
const sql = query => execFileSync(cfg.mysql, ['--no-defaults', '--host=127.0.0.1', '--port=14306', '--user=root', '--batch', '--skip-column-names', `--execute=${query}`], { encoding: 'utf8' }).trim();
assert.equal(sql('SELECT @@server_uuid'), '580d1315-c4bf-11f1-bf4b-14cb19888cfa');
for (const db of Object.values(cfg.databases)) assert.match(db, /^qual_[a-f0-9]{8}_[a-z]+$/);
const hex = id => { assert.match(id, /^[a-f0-9-]{36}$/i); return id.replaceAll('-', ''); };
const evidence = [];
// Restart fault injection temporarily stops the test services; start browser qualification only after recovery.
const readyDeadline = Date.now() + 10 * 60 * 1000;
while (!JSON.parse(fs.readFileSync(`${cfg.run}/cases.json`, 'utf8')).some(item => item.label === 'four-owned-service-restarts' && item.state === 'PASS')) {
  assert.ok(Date.now() < readyDeadline, 'API/restart qualification has not completed');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    let owner = crypto.randomUUID();
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const message = encode({ alg: 'HS512', typ: 'JWT' }) + '.' + encode({ sub: owner, customerId: owner, iss: 'org-access', exp: Math.floor(Date.now() / 1000) + 3600, roles: ['ROLE_CUSTOMER'], accountType: 'customer' });
    let token = message + '.' + crypto.createHmac('sha512', cfg.secret).update(message).digest('base64url');
    if (delivery) {
      const bytes = fs.readFileSync('.local/isolated-login-fixture.json');
      const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
      const auth = await fetch(base + '/org-access/api/auth/customer/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fixture.email, password: 'LocalQaOnly9' }) });
      assert.equal(auth.status, 200);
      const login = await auth.json();
      owner = login.user.id; token = login.token;
    }
    const items = selections.slice(0, process.env.CHECKOUT_SINGLE_STORE === 'true' ? 1 : delivery || width === 1440 ? 2 : 3).map(entry => ({ ...entry.item, id: entry.item.productId, storeId: entry.storeId, title: entry.item.productName, price: entry.item.unitPrice }));
    const destination = delivery ? { latitude: 17.4419210, longitude: 78.4482870 } : null;
    const quotes = [];
    if (delivery) for (const item of items) {
      const response = await fetch(`${base}/catalog/api/v1/stores/${item.storeId}/delivery-quote?latitude=${destination.latitude}&longitude=${destination.longitude}&orderTotal=${item.price}&deliveryMethod=instant`);
      assert.equal(response.status, 200);
      const quote = await response.json();
      assert.equal(quote.deliveryAvailable, true);
      quotes.push(quote);
    }
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Only profile is controlled. Cart, Catalog, Order, Inventory and Payment are real cloned services.
    if (!delivery) await page.route('**/customer-profile/**', route => route.fulfill({ json: [] }));
    await context.addInitScript(({ owner, token, items, destination, quotes }) => {
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('user', JSON.stringify({ id: owner, name: 'Isolated checkout customer', role: 'customer' }));
      localStorage.setItem('guestCartItems', JSON.stringify(items));
      const address = { address: 'SR Nagar Main Road, Hyderabad, Telangana, 500038, India', isDefault: true, manualLocation: { street: 'SR Nagar Main Road', city: 'Hyderabad', state: 'Telangana', pincode: '500038' } };
      if (destination) localStorage.setItem('addresses', JSON.stringify([address]));
      if (location.pathname === '/payment-options') history.replaceState({ usr: { checkout: { method: destination ? 'instant' : 'pickup', deliveryAddress: destination ? address.address : '', customerLatitude: destination?.latitude, customerLongitude: destination?.longitude, deliveryFee: quotes.reduce((sum, quote) => sum + Number(quote.deliveryCharge), 0), deliveryLines: items.map((item, index) => ({ storeId: item.storeId, productId: item.productId, deliveryCharge: Number(quotes[index]?.deliveryCharge || 0) })) } } }, '', location.href);
    }, { owner, token, items, destination, quotes });
    await page.goto(base + '/payment-options', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Pay / }).click();
    await page.waitForURL('**/checkout-group/*');
    const groupId = new URL(page.url()).pathname.split('/').at(-1);
    await page.getByRole('heading', { name: 'Orders saved', exact: true }).waitFor();
    const response = await page.request.get(`${base}/order-api/api/v1/checkouts/${groupId}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status(), 200);
    const group = await response.json();
    assert.equal(group.state, 'COMPLETED');
    assert.equal(group.customerId, owner);
    assert.equal(group.children.length, items.length);
    if (delivery) assert.equal(Number(group.aggregateTotal), items.reduce((sum, item, index) => sum + Number(item.price) + Number(quotes[index].deliveryCharge) + 5, 0));
    assert.equal(Number(sql(`SELECT COUNT(*) FROM ${cfg.databases['order-service']}.checkout_groups WHERE id='${groupId}' AND customer_id='${owner}'`)), 1);
    const payments = [];
    for (const child of group.children) {
      assert.equal(Number(child.handlingFee), 5);
      assert.equal(Number(sql(`SELECT COUNT(*) FROM ${cfg.databases['order-service']}.orders WHERE id=UNHEX('${hex(child.orderId)}') AND customer_id=UNHEX('${hex(owner)}')`)), 1);
      await page.getByText(/Payment UID:/).nth(payments.length).waitFor();
      const paymentResponse = await page.request.get(`${base}/payments/api/v1/payments/order/${child.orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(paymentResponse.status(), 200);
      const payment = await paymentResponse.json();
      assert.equal(payment.status, 'PENDING');
      const row = sql(`SELECT HEX(id),amount,status FROM ${cfg.databases['payment-service']}.payments WHERE order_id=UNHEX('${hex(child.orderId)}')`).split('\t');
      assert.equal(row[0].toLowerCase(), hex(payment.id));
      assert.equal(Number(row[1]), Number(child.total));
      assert.equal(row[2], 'PENDING');
      await page.getByText('Payment UID: ' + payment.id, { exact: true }).waitFor();
      payments.push(payment);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${output}/browser-${width}.png`, fullPage: true });
    evidence.push({ width, owner, group, payments, state: 'PASS', profileControlled: !delivery, delivery, actualAuthentication: delivery });
    fs.writeFileSync(`${output}/browser.json`, JSON.stringify(evidence, null, 2));
    console.log(`PASS actual persisted browser checkout ${width}: ${items.length} child orders and pending DB payment UUIDs`);
    await context.close();
  }
} catch (error) {
  evidence.push({ state: 'FAIL', error: error.stack });
  fs.writeFileSync(`${cfg.run}/browser.json`, JSON.stringify(evidence, null, 2));
  throw error;
} finally { await browser.close(); }
