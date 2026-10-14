import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      history.replaceState({ usr: { startManual: true, draft: { houseNumber: '', floor: '4', landmark: 'Community hall', phone: '9398987413', manualLocation: { street: 'SR Nagar', city: 'Hyderabad', state: 'Telangana', pincode: '500038' } } } }, '', location.href);
    });
    await page.goto('http://127.0.0.1:5184/address-form');
    await page.getByRole('button', { name: 'Save Address Details' }).click();
    await page.getByText('Enter your house number, building name or area.', { exact: true }).waitFor();
    assert.equal(await page.locator('#address-houseNumber').evaluate(element => element === document.activeElement), true);
    assert.equal(await page.locator('#address-phone').getAttribute('aria-invalid'), 'false');
    await page.locator('#address-houseNumber').fill('12-A');
    await page.locator('#address-phone').fill('123');
    await page.getByRole('button', { name: 'Save Address Details' }).click();
    await page.getByText('Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.', { exact: true }).waitFor();
    assert.equal(await page.locator('#address-houseNumber').getAttribute('aria-invalid'), 'false');
    await page.getByRole('button', { name: 'Use GPS', exact: true }).click();
    await page.waitForURL('**/address-map');
    await page.getByText('Select delivery location', { exact: true }).waitFor();
    await page.locator('.map-page-header button').click();
    await page.waitForURL('**/address-form');
    assert.equal(await page.locator('#address-houseNumber').inputValue(), '12-A');
    assert.equal(await page.locator('#address-floor').inputValue(), '4');
    assert.equal(await page.locator('#address-landmark').inputValue(), 'Community hall');
    assert.equal(await page.locator('#address-phone').inputValue(), '123');
    assert.deepEqual(errors, []);
    console.log(`PASS address validation, GPS map navigation and draft preservation at ${width}px`);
    await page.close();
  }
} finally { await browser.close(); }
