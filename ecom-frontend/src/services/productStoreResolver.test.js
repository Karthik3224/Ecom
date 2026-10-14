import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberProductStore, resolveProductStore } from './productStoreResolver.js';

test('global listing never falls back to the same product at Hyderabad Main', () => {
  const data=new Map();
  globalThis.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
  data.set('local:stores',JSON.stringify([{id:'india-store-1-1',name:'Hyderabad Main Store'}]));
  const catalog=[{productId:'nuts',storeId:'india-store-1-1',store:'Hyderabad Main Store'}];
  data.set('productStoreIndex',JSON.stringify({nuts:{storeId:'india-store-1-1',store:'Hyderabad Main Store'}}));
  const global={productId:'nuts',storeId:'global-store',store:'India-wide Global Store'};
  assert.equal(resolveProductStore(global,catalog).storeId,'global-store');
  assert.equal(rememberProductStore(global).storeId,'global-store');
  assert.equal(resolveProductStore({...global,store:'Hyderabad Main Store'},catalog).storeId,'global-store');
  data.set('local:stores',JSON.stringify([{id:'india-store-1-1',name:'Hyderabad Main Store'},{id:'global-store',name:'India-wide Global Store'}]));
  assert.equal(resolveProductStore(global,catalog).store,'India-wide Global Store');
});
