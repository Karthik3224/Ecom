import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_MODULE+'/package.json')('playwright');
const bytes=readFileSync('.local/isolated-login-fixture.json');
const owner=JSON.parse(bytes.toString(bytes[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,'')).customerId;
const base='http://127.0.0.1:5184';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const stage of ['COMPLETED','RESERVING']){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.setDefaultTimeout(60000);
  const oldCart=randomUUID(),oldId=randomUUID(),newId=randomUUID();
  const oldStore={customerId:owner,storeId:'a',items:[{productId:randomUUID(),quantity:1,unitPrice:169}],cartId:oldCart};
  const old={id:oldId,customerId:owner,state:stage,aggregateTotal:174,children:[{storeId:'a',cartId:oldCart,orderId:stage==='COMPLETED'?randomUUID():null,state:stage==='COMPLETED'?'CONFIRMED':'RESERVED',handlingFee:5}]};
  const items=['a','b'].map(storeId=>({id:randomUUID(),productId:randomUUID(),storeId,title:'Changed product',quantity:1,price:169,unitPrice:169}));
  const carts=items.map(item=>({id:randomUUID(),customerId:owner,storeId:item.storeId,status:'ACTIVE',items:[item]}));
  const children=carts.map(cart=>({storeId:cart.storeId,cartId:cart.id,orderId:randomUUID(),state:'CONFIRMED',handlingFee:5,subtotal:169,deliveryFee:0,total:174,orderStatus:'CREATED'}));
  const fresh={id:newId,customerId:owner,state:'COMPLETED',aggregateTotal:348,children};
  let submissions=0,oldReads=0;
  await page.route('**/catalog/**',r=>r.fulfill({json:[]}));await page.route('**/customer-profile/**',r=>r.fulfill({json:[]}));
  await page.route('**/order-api/**',r=>r.fulfill({json:[]}));
  await page.route('**/order-api/api/v1/checkouts/by-key/*',r=>{oldReads++;return r.fulfill({json:old});});
  await page.route('**/order-api/api/v1/checkouts',r=>{submissions++;assert.notEqual(r.request().headers()['idempotency-key'],'old-accepted-key');return r.fulfill({json:fresh});});
  await page.route('**/order-api/api/v1/checkouts/'+oldId,r=>r.fulfill({json:old}));
  await page.route('**/order-api/api/v1/checkouts/'+newId,r=>r.fulfill({json:fresh}));
  await page.route('**/inventory/api/v1/inventories?*',r=>{const q=new URL(r.request().url()).searchParams;return r.fulfill({json:{storeId:q.get('storeId'),productId:q.get('productId'),variantId:null,status:'ACTIVE',availableQuantity:10}});});
  await page.route('**/cart-api/**',r=>{const url=new URL(r.request().url());assert.ok(!url.pathname.includes(oldCart),'No stale claimed cart may be reused');return r.fulfill({json:carts.find(cart=>cart.storeId===url.searchParams.get('storeId')||url.pathname.endsWith(cart.id))});});
  await page.route('**/payments/api/v1/payments/order/*',r=>{const child=children.find(c=>r.request().url().endsWith(c.orderId));return r.fulfill({json:{id:randomUUID(),customerId:owner,orderId:child.orderId,amount:174,status:'PENDING'}});});
  await context.addInitScript(({owner,items,oldStore})=>{
   sessionStorage.setItem('isLoggedIn','true');sessionStorage.setItem('authToken','controlled.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}))+'.controlled');
   sessionStorage.setItem('user',JSON.stringify({id:owner,name:'Controlled customer',role:'customer'}));localStorage.setItem('guestCartItems',JSON.stringify(items));
   sessionStorage.setItem('checkout-group-attempt',JSON.stringify({key:'old-accepted-key',submitted:true,body:JSON.stringify({stores:[oldStore]})}));
   sessionStorage.setItem('checkout-cart:'+owner+':a',JSON.stringify({body:JSON.stringify(oldStore.items),cartId:oldStore.cartId,keys:['old-add-key']}));
   if(location.pathname==='/payment-options')history.replaceState({usr:{checkout:{method:'pickup',deliveryFee:0,deliveryLines:items.map(item=>({storeId:item.storeId,productId:item.productId,deliveryCharge:0}))}}},'',location.href);
  },{owner,items,oldStore});
  await page.goto(base+'/payment-options',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:/^Pay /}).click();
  await page.waitForURL('**/checkout-group/'+(stage==='COMPLETED'?newId:oldId));
  await page.getByRole('heading',{name:stage==='COMPLETED'?'Orders saved':'Reserving store inventory',exact:true}).waitFor();
  assert.ok(oldReads>=1);assert.equal(submissions,stage==='COMPLETED'?1:0);
  assert.equal(await page.getByText('Retry the unresolved checkout before changing cart contents.',{exact:false}).count(),0);
  console.log('PASS controlled changed-cart '+stage+': persisted state read first; '+submissions+' new submissions; no stale cart reuse');await context.close();
 }
}finally{await browser.close();}
