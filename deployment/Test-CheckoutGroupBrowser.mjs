import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const require=createRequire(process.env.PLAYWRIGHT_MODULE+'/package.json');
const { chromium }=require('playwright');
const bytes=await readFile('.local/isolated-login-fixture.json');
const fixture=JSON.parse(bytes.toString(bytes[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,''));
const output='.local/multistore-browser';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const groupId='11111111-1111-4111-8111-111111111111';
try {
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5184/login',{waitUntil:'domcontentloaded'});
    await page.getByRole('textbox',{name:/^Email/}).fill(fixture.email);
    await page.locator('input[type="password"]').fill('LocalQaOnly9');
    await page.getByRole('button',{name:'Login',exact:true}).click();
    await page.waitForURL('**/home',{timeout:60000});
    let state='RESERVING';
    let fail=false;
    let reads=0;
    await page.route('**/order-api/api/v1/checkouts/'+groupId,async route=>{
      reads++;
      if(fail) return route.fulfill({status:503,json:{message:'Checkout status temporarily unavailable'}});
      const children=['a','b','c'].map((storeId,index)=>({storeId,cartId:storeId,orderId:groupId+'-'+index,
        state:state==='COMPLETED'?'CONFIRMED':'RESERVED',handlingFee:5,subtotal:20,deliveryFee:0,total:25,orderStatus:'CREATED',paymentStatus:'PENDING'}));
      await route.fulfill({status:200,json:{id:groupId,customerId:fixture.customerId,state,aggregateTotal:state==='COMPLETED'?75:null,children}});
    });
    for(const stage of ['RESERVING','COMMITTING','COMPENSATING','FAILED','COMPLETED']) {
      state=stage;
      await page.goto('http://127.0.0.1:5184/checkout-group/'+groupId,{waitUntil:'domcontentloaded'});
      const heading={RESERVING:'Reserving store inventory',COMMITTING:'Confirming store orders',COMPENSATING:'Releasing checkout reservations',FAILED:'Checkout unsuccessful',COMPLETED:'Orders saved'}[stage];
      await page.getByRole('heading',{name:heading,exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'View Order Details & Tracking',exact:true}).count(),stage==='COMPLETED'?3:0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal overflow');
      await page.screenshot({path:`${output}/${viewport.width}-${stage}.png`,fullPage:true});
    }
    const terminalReads=reads;
    await page.waitForTimeout(4500);
    assert.equal(reads,terminalReads,'Terminal checkout polling stops');
    fail=true;
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('alert').filter({hasText:'Checkout status temporarily unavailable'}).waitFor();
    fail=false;
    await page.getByRole('button',{name:'Try Again',exact:true}).click();
    await page.getByRole('heading',{name:'Orders saved',exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    console.log(`PASS controlled group states, retry, terminal polling, layout ${viewport.width}; not a live checkout test`);
    await context.close();
  }
} finally {await browser.close();}
