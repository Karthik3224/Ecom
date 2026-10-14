import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const { chromium } = createRequire(process.env.PLAYWRIGHT_MODULE + '/package.json')('playwright');
const base='http://127.0.0.1:5184';
const orderId='bbbd82f0-6f9b-4d6a-9b00-61997de8e005';
const deadline=Date.now()+240000;
for (const port of [3310,3311,3315]) {
  while (true) {
    try { const r=await fetch(`http://127.0.0.1:${port}/actuator/health`); if(r.ok && (await r.json()).status==='UP') break; } catch { /* Local service reload. */ }
    assert.ok(Date.now()<deadline,'Local services did not become healthy');
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
}
const signIn=async username=>{
  const r=await fetch(base+'/org-access/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password:'admin123'})});
  assert.equal(r.status,200); return (await r.json()).token;
};
const token=await signIn('deliverypartnersrnagar01');
const headers={Authorization:'Bearer '+token};
const feed=await fetch(base+'/org-access/api/delivery/me/orders',{headers});
assert.equal(feed.status,200,await feed.text().then(text=>{ try { return JSON.stringify(JSON.parse(text)); } catch { return text; } }));
// Re-read because the assertion consumed the diagnostic response body.
const deliveries=await (await fetch(base+'/org-access/api/delivery/me/orders',{headers})).json();
const assigned=deliveries.find(order=>order.id===orderId);
assert.ok(assigned,'Saved active SR Nagar assignment is missing');
assert.ok(deliveries.every(order=>String(order.shipment.deliveryPartnerId)==='81'));
const otherToken=await signIn('deliverypartnerhydmain01');
const otherHeaders={Authorization:'Bearer '+otherToken};
assert.equal((await fetch(base+'/order-api/api/v1/orders/'+orderId,{headers:otherHeaders})).status,403);
assert.equal((await fetch(base+'/fulfillment/api/v1/shipments/order/'+orderId,{headers:otherHeaders})).status,403);
assert.equal((await fetch(base+'/order-api/api/v1/orders?storeId=india-store-1-3',{headers})).status,403);
assert.equal((await fetch(base+'/order-api/api/v1/orders/'+orderId+'/cancel',{method:'POST',headers})).status,403);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const oldClaims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
  delete oldClaims.deliveryPartnerId;
  oldClaims.jti=crypto.randomUUID();
  const unsigned=token.split('.')[0]+'.'+Buffer.from(JSON.stringify(oldClaims)).toString('base64url');
  const oldToken=unsigned+'.'+crypto.createHmac('sha512','isolated-qualification-jwt-'+'x'.repeat(64)).update(unsigned).digest('base64url');
  const stalePage=await browser.newPage();
  await stalePage.addInitScript(({token})=>{
    if(location.origin!=='http://127.0.0.1:5184'||sessionStorage.getItem('staleLoginFixture'))return;
    sessionStorage.setItem('staleLoginFixture','true');
    sessionStorage.setItem('authToken',token);
    sessionStorage.setItem('isLoggedIn','true');
    sessionStorage.setItem('user',JSON.stringify({id:'81',name:'Local partner session test',role:'delivery-partner'}));
  },{token:oldToken});
  await stalePage.goto(base+'/delivery/orders',{waitUntil:'domcontentloaded'});
  await stalePage.waitForURL('**/login');
  await stalePage.getByText('Please sign in again to load your updated delivery assignments.',{exact:true}).waitFor();
  await stalePage.close();
  console.log('PASS old partner session prompts reauthentication without granting extra permissions');
  for (const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.goto(base+'/login',{waitUntil:'domcontentloaded'});
    await page.getByRole('textbox',{name:'Email, Mobile Number or Username'}).fill('deliverypartnersrnagar01');
    await page.locator('input[type=password]').fill('admin123');
    await page.getByRole('button',{name:'Sign in',exact:true}).click();
    await page.waitForURL('**/delivery');
    await page.goto(base+'/delivery/orders',{waitUntil:'domcontentloaded'});
    await page.getByText(assigned.orderNumber||orderId,{exact:true}).first().waitFor({timeout:60000});
    assert.equal(await page.getByText('Delivery orders are temporarily unavailable. Please retry.',{exact:true}).count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    console.log(`PASS saved SR Nagar assignment shown at ${width}px; foreign-partner and mutation denials verified`);
    await page.close();
  }
} finally {await browser.close();}
