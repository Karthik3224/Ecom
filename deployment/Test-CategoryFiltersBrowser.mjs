import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  const keyErrors = [];
  page.on('console', message => { if (/same key/i.test(message.text())) keyErrors.push(message.text()); });
  await page.addInitScript(() => localStorage.setItem('selectedLocation', JSON.stringify({ source: 'manual', city: 'Hyderabad', address: 'SR Nagar, Hyderabad', latitude: 17.441921, longitude: 78.448287 })));
  await page.goto('http://127.0.0.1:5184/home');
  await page.locator('.category-nav-item').filter({ hasText: 'Traditional Pickles' }).click();
  await page.locator('.subcategory-nav').waitFor();
  const names = await page.locator('.subcategory-nav button').allTextContents();
  for (const name of [...names, 'All']) {
    await page.locator('.subcategory-nav').getByRole('button', { name, exact: true }).click();
    const cards = await page.locator('.home-content-scroll .product-card').count();
    if (cards) {
      const heading = await page.getByRole('heading', { name: /Traditional Pickles Products/ }).innerText();
      assert.equal(Number(heading.match(/\((\d+)\)/)[1]), cards);
      const titles = await page.locator('.home-content-scroll .product-title').allTextContents();
      assert.equal(new Set(titles).size, titles.length);
    }
    console.log(`PASS ${name}: ${cards} cards, matching count, no duplicates`);
  }
  assert.deepEqual(keyErrors, []);
} finally { await browser.close(); }
