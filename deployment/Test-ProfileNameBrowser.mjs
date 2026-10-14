import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes = fs.readFileSync('.local/isolated-login-fixture.json');
const fixture = JSON.parse(bytes.toString(bytes[0] === 255 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
const response = await fetch('http://127.0.0.1:5184/org-access/api/auth/customer/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fixture.email, password: 'LocalQaOnly9' }) });
assert.equal(response.status, 200);
const session = await response.json();
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('isLoggedIn', 'true');
    history.replaceState({ usr: { completeProfile: true } }, '', location.href);
  }, session);
  await page.goto('http://127.0.0.1:5184/profile');
  const field = page.getByRole('textbox', { name: 'Full Name', exact: true });
  await field.waitFor();
  for (const value of ['ab', '123', 'a b']) {
    await field.fill(value);
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await page.locator('#profile-name-error').waitFor();
    assert.equal(await field.getAttribute('aria-invalid'), 'true');
  }
  await field.fill('Kar');
  await field.blur();
  assert.equal(await field.getAttribute('aria-invalid'), 'false');
  console.log('PASS profile rejects fewer than three letters, digits and padding; accepts Kar');
} finally { await browser.close(); }
