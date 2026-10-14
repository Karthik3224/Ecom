import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('selectedLocation', JSON.stringify({ source: 'manual', title: 'SR Nagar', address: 'SR Nagar, Hyderabad', city: 'Hyderabad', latitude: 17.441921, longitude: 78.448287 }));
  });
  await page.goto('http://127.0.0.1:5184/address-map');
  await page.getByRole('button', { name: 'Confirm Location', exact: true }).click({ timeout: 60000 });
  await page.getByRole('dialog', { name: 'Location confirmed' }).waitFor();
  assert.equal(new URL(page.url()).pathname, '/address-map');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForURL('**/home');
  console.log('PASS location confirmation popup and Continue navigation');
} finally { await browser.close(); }
