import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium }=createRequire(process.env.PLAYWRIGHT_MODULE+'/package.json')('playwright');
const bytes=fs.readFileSync('.local/isolated-login-fixture.json');
const fixture=JSON.parse(bytes.toString(bytes[0]===255?'utf16le':'utf8').replace(/^\uFEFF/,''));
const login=await fetch('http://127.0.0.1:5184/org-access/api/auth/customer/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fixture.email,password:'LocalQaOnly9'})});
assert.equal(login.status,200);
const session=await login.json();
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage();
  await page.addInitScript(({user,token})=>{ sessionStorage.setItem('user',JSON.stringify(user)); sessionStorage.setItem('authToken',token); sessionStorage.setItem('isLoggedIn','true'); },session);
  await page.goto('http://127.0.0.1:5184/order-details/93cda4f8-7121-4138-b562-633c6f39e281',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'View Invoice'}).click();
  await page.getByRole('button',{name:'Download Invoice PDF'}).waitFor();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download Invoice PDF'}).click()]);
  const path=await download.path();
  assert.ok(path);
  assert.ok(fs.readFileSync(path).toString('ascii',0,8).startsWith('%PDF-1.4'));
  assert.match(download.suggestedFilename(),/^invoice-.*\.pdf$/);
  console.log(`PASS invoice preview and PDF download ${download.suggestedFilename()}`);
} finally { await browser.close(); }
