import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  page.on('console', message => {
    if (/Google Maps|ApiNot|Referer|Billing|REQUEST_DENIED/i.test(message.text())) console.log(message.text().replace(/key=[^&\s]+/g, 'key=REDACTED'));
  });
  await page.goto('http://127.0.0.1:5184/address-map');
  await page.locator('.google-location-input').waitFor({ timeout: 30000 });
  await page.locator('.google-location-input').click();
  await page.keyboard.type('Kadapa', { delay: 150 });
  await page.waitForTimeout(6000);
  console.log((await page.locator('gmp-place-autocomplete').innerText()).slice(0, 1000));
  await page.screenshot({ path: '.local/google-places-new.png', fullPage: true });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.locator('.google-location-address').waitFor();
  assert.match(await page.locator('.google-location-address').innerText(), /Kadapa/);
  await page.getByRole('button', { name: 'Confirm Location', exact: true }).click();
  await page.getByRole('dialog', { name: 'Location confirmed' }).waitFor();
  console.log('PASS live Places API (New): Kadapa suggestions, selection, address details and confirmation');
} finally { await browser.close(); }
