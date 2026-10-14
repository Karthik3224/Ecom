import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const username of ['deliverypartnersrnagar01', 'deliverypartnerhydmain01']) {
    const page = await browser.newPage();
    const failures = [];
    page.on('response', response => { if (response.status() === 401) failures.push(new URL(response.url()).pathname); });
    await page.goto('http://127.0.0.1:5184/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: 'Email, Mobile Number or Username' }).fill(username);
    await page.locator('input[type=password]').fill('admin123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**/delivery');
    await page.waitForTimeout(16000);
    console.log(JSON.stringify({ username, path: new URL(page.url()).pathname, unauthorizedRequests: failures }));
    assert.equal(new URL(page.url()).pathname, '/delivery');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    assert.equal(new URL(page.url()).pathname, '/delivery');
    await page.close();
  }
} finally { await browser.close(); }
