import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium }=createRequire(process.env.PLAYWRIGHT_MODULE+'/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 page.on('pageerror',error=>console.log('PAGE ERROR',error.message));
 await page.goto('http://127.0.0.1:5184/home');
 const result=await page.evaluate(async()=>{
   const stores=await (await fetch('/catalog/api/v1/stores')).json();
   localStorage.removeItem('local:stores');
   if (!stores.some(store => store.id === 'global-store')) throw new Error('Global store missing');
   const {buildCartDeliveryLines}=await import('/src/services/cartDeliveryLines.js');
   const cartItems=[{storeId:'india-store-1-3',productId:'qa-local',price:499,quantity:1},{storeId:'global-store',productId:'qa-global',price:169,quantity:1}];
   return buildCartDeliveryLines({cartItems,latitude:17.4419,longitude:78.4483,storeMethods:{'india-store-1-3':'pickup'}});
 });
 console.log(JSON.stringify(result));
 assert.equal(result[0].deliveryType,'pickup');
 assert.equal(result[1].fulfillmentType,'global');
} finally {await browser.close();}
