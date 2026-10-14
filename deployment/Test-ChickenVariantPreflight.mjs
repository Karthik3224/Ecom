import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const bytes=fs.readFileSync('.local/isolated-login-fixture.json');
const fixture=JSON.parse(bytes.toString(bytes[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,''));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage();page.setDefaultTimeout(60000);
  await page.goto('http://localhost:5184/login');
  await page.getByRole('textbox',{name:/^Email/}).fill(fixture.email);
  await page.locator('input[type=password]').fill('LocalQaOnly9');
  await page.getByRole('button',{name:'Login',exact:true}).click();await page.waitForURL('**/home');
  const writes=[];
  page.on('request',request=>{if(/\/(inventory|order-api|cart-api|payments)\//.test(request.url())&&request.method()!=='GET')writes.push(request.url());});
  await page.evaluate(async()=>{
    const {validateCheckoutAvailability}=await import('/src/utils/checkoutAvailability.js');
    const {getInventoryForItem}=await import('/src/services/inventoryApi.js');
    await validateCheckoutAvailability([{storeId:'store-gachibowli',items:[{productId:'21000000-0000-0000-0000-000000000018',variantId:'c88eae9d-c3cf-11f1-860d-14cb19888cfa',quantity:1,productName:'Chicken Curry Cut'}]}],getInventoryForItem);
  });
  assert.deepEqual(writes,[]);
  console.log('PASS real authenticated browser preflight for exact Gachibowli Chicken variant; no checkout or inventory writes');
}finally{await browser.close();}
