import test from 'node:test';
import assert from 'node:assert/strict';
import { requestNotificationAccess } from './notificationPermission.js';
test('granted and denied notifications never request again', async () => {
 for (const permission of ['granted','denied']) assert.equal(await requestNotificationAccess({Notification:{permission,requestPermission:()=>assert.fail('repeat prompt')}}),permission);
});
test('dismissed notification prompt is not repeated during the session', async () => {
 const values=new Map();let calls=0;
 const browser={sessionStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},Notification:{permission:'default',requestPermission:async()=>{calls++;return 'default';}}};
 assert.equal(await requestNotificationAccess(browser),'default');
 assert.equal(await requestNotificationAccess(browser),'default');assert.equal(calls,1);
});
test('notification permissions use actual browser results and unsupported fallbacks', async () => {
 assert.equal(await requestNotificationAccess({Notification:{permission:'default',requestPermission:async()=> 'denied'}}),'denied');
 assert.equal(await requestNotificationAccess({isSecureContext:false}),'unsupported');
 assert.equal(await requestNotificationAccess({}),'unsupported');
});
