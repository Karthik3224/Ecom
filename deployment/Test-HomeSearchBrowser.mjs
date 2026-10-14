import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.addInitScript(() => localStorage.setItem('selectedLocation', JSON.stringify({ source: 'manual', city: 'Hyderabad', address: 'SR Nagar, Hyderabad', latitude: 17.441921, longitude: 78.448287 })));
  await page.goto('http://127.0.0.1:5184/home');
  await page.locator('.product-card').first().waitFor();
  await page.locator('.header-search input').fill('an');
  await page.getByRole('heading', { name: /Results for "an"/ }).waitFor();
  const titles = await page.locator('.home-content-scroll .product-title').allTextContents();
  assert.ok(titles.length > 0);
  assert.ok(titles.every(title => title.toLowerCase().includes('an')), JSON.stringify(titles));
  const heading = await page.getByRole('heading', { name: /Results for "an"/ }).innerText();
  assert.equal(Number(heading.match(/\((\d+)\)/)[1]), titles.length);
  await page.locator('.header-search input').fill('zzzznoresults');
  await page.locator('.no-products-found').waitFor();
  assert.equal(await page.locator('.home-content-scroll .product-card').count(), 0);
  console.log(`PASS 'an' returns only matching names (${titles.length}); unmatched query shows no products`);
} finally { await browser.close(); }
