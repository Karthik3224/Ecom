import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5184/home');
  const chosen = { source: 'manual', title: 'SR Nagar', address: 'SR Nagar, Hyderabad', city: 'Hyderabad', latitude: 17.441921, longitude: 78.448287 };
  await page.evaluate(value => localStorage.setItem('selectedLocation', JSON.stringify(value)), chosen);
  await page.reload();
  await page.locator('.delivery-location').getByText(chosen.address, { exact: true }).waitFor();
  await page.locator('.header-logo').click();
  for (const route of ['/search', '/stores', '/home']) {
    await page.goto('http://127.0.0.1:5184' + route);
    if (route !== '/search') await page.locator('.delivery-location').getByText(chosen.address, { exact: true }).waitFor();
    else await page.locator('input').first().waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('selectedLocation'))), chosen);
  }
  await page.reload();
  await page.locator('.delivery-location').getByText(chosen.address, { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('selectedLocation'))), chosen);
  console.log('PASS selected Home location remains unchanged across search, stores, Home and refresh');
} finally { await browser.close(); }
