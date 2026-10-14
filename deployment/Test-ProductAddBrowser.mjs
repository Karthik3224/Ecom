import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const base = 'http://127.0.0.1:5184';
const bytes = fs.readFileSync('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const response = await fetch(base + '/org-access/api/auth/customer/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: fixture.email, password: 'LocalQaOnly9' }),
});
assert.equal(response.status, 200);
const login = await response.json();
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(({ token, user }) => {
      if (location.origin !== 'http://127.0.0.1:5184') return;
      if (!sessionStorage.getItem('authToken')) {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('isLoggedIn', 'true');
        localStorage.removeItem('guestCartItems');
        localStorage.setItem('selectedLocation', JSON.stringify({ source: 'manual', city: 'Hyderabad', address: 'SR Nagar, Hyderabad', latitude: 17.441921, longitude: 78.448287 }));
        localStorage.setItem('addresses', JSON.stringify([{ address: 'SR Nagar, Hyderabad, Telangana, 500038, India', isDefault: true, coordinates: { lat: 17.441921, lng: 78.448287 } }]));
      }
    }, login);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + (process.env.TEST_GLOBAL_STOCK === 'true' ? '/stores/global-store' : '/home'));
    if (process.env.TEST_BANNER_LINKS === 'true') {
      const banner = page.getByRole('link', { name: /^Browse / }).first();
      await banner.waitFor();
      const destination = await banner.getAttribute('href');
      await banner.click();
      await page.waitForURL(base + destination);
      assert.match(new URL(page.url()).pathname, /^\/banners\//);
      await page.getByRole('heading', { name: 'Products', exact: true }).waitFor();
      await page.getByRole('button', { name: /^add$/i }).first().waitFor({ timeout: 60000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.reload();
      await page.getByRole('heading', { name: 'Products', exact: true }).waitFor();
      assert.deepEqual(errors, []);
      console.log(`PASS banner click navigates to ${destination} at ${width}px`);
      await context.close();
      continue;
    }
    await page.locator('.product-card').first().scrollIntoViewIfNeeded();
    const add = page.getByRole('button', { name: /^add$/i }).first();
    try { await add.click({ timeout: 60000 }); }
    catch (error) { console.log((await page.locator('body').innerText()).slice(0, 5000)); throw error; }
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('guestCartItems') || '[]').some(item => item.quantity === 1));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('guestCartItems')));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].quantity, 1);
    if (process.env.TEST_GLOBAL_STOCK === 'true') assert.equal(saved[0].storeId, 'global-store');
    await page.reload();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('guestCartItems') || '[]').some(item => item.quantity === 1));
    assert.deepEqual(errors, []);
    console.log(`PASS ${process.env.TEST_GLOBAL_STOCK === 'true' ? 'India-wide store' : 'Home'} Add and reload persistence at ${width}px`);
    await context.close();
  }
} finally { await browser.close(); }
