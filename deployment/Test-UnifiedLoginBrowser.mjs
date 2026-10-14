import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes = fs.readFileSync('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const deadline = Date.now() + 120000;
while (true) {
  try { const health = await fetch('http://127.0.0.1:3310/actuator/health'); if (health.ok && (await health.json()).status === 'UP') break; } catch { /* Local service startup. */ }
  assert.ok(Date.now() < deadline, 'Local authentication did not become healthy');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
const response = await fetch('http://127.0.0.1:5184/org-access/api/auth/customer/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fixture.email, password: 'LocalQaOnly9' }) });
assert.equal(response.status, 200);
const customer = await response.json();
assert.ok(customer.user.phone);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const [identifier, password, destination] of [['storemanagerhydmain', 'admin123', '/store-manager/dashboard'], ['storemanagersrnagar', 'admin123', '/store-manager/dashboard'], [fixture.email, 'LocalQaOnly9', '/home'], [customer.user.phone, 'LocalQaOnly9', '/home']]) {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5184/login');
    await page.getByRole('textbox', { name: 'Email, Mobile Number or Username' }).fill(identifier);
    await page.locator('input[type=password]').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**' + destination, { timeout: 60000 });
    const role = await page.evaluate(() => JSON.parse(sessionStorage.getItem('user')).role);
    assert.equal(role, destination === '/home' ? 'customer' : 'store-manager');
    console.log(`PASS regular login redirects authenticated ${role} to ${destination}`);
    await page.close();
  }
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5184/login');
  await page.getByRole('button', { name: 'Sign in with Email OTP', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email', exact: false }).waitFor();
  await page.getByRole('button', { name: 'Back to Login', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in with Mobile OTP', exact: true }).click();
  await page.getByRole('textbox', { name: 'Mobile Number' }).waitFor();
  console.log('PASS separate email and mobile OTP forms');
} finally { await browser.close(); }
