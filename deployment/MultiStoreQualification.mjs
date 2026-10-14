import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [mode,path]=process.argv.slice(2);
const cfg=JSON.parse(fs.readFileSync(path,'utf8').replace(/^\uFEFF/,''));
cfg.ports.orderDrop??=cfg.ports.control+1;
const evidence=[];
const save=()=>fs.writeFileSync(`${cfg.run}/cases.json`,JSON.stringify(evidence,null,2));
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const sql=query=>execFileSync(cfg.mysql,['--no-defaults','--host=127.0.0.1','--port=14306','--user=root','--batch','--skip-column-names',`--execute=${query}`],{encoding:'utf8'}).trim();
try{assert(sql('SELECT @@server_uuid')==='580d1315-c4bf-11f1-bf4b-14cb19888cfa','Wrong MySQL UUID');}
catch(error){evidence.push({label:'mysql-preflight',state:'FAIL',error:error.message});save();throw error;}
for(const db of Object.values(cfg.databases))assert(/^qual_[a-f0-9]{8}_[a-z]+$/.test(db),'Unsafe clone name');
const db=name=>cfg.databases[`${name}-service`];
const hex=id=>{assert(/^[a-f0-9-]{36}$/i.test(id),'Invalid UUID');return id.replaceAll('-','');};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const token=owner=>{
  const part=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
  const text=part({alg:'HS512',typ:'JWT'})+'.'+part({sub:owner,customerId:owner,iss:'org-access',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,accountType:'customer',roles:['ROLE_CUSTOMER']});
  return text+'.'+crypto.createHmac('sha512',cfg.secret).update(text).digest('base64url');
};
async function api(service,url,{owner,body,key,method=body?'POST':'GET',status=200}={}){
  const response=await fetch(`http://127.0.0.1:${cfg.ports[`${service}-service`]}/api/v1/${url}`,{method,headers:{'Content-Type':'application/json',...(owner?{Authorization:`Bearer ${token(owner)}`} :{}),...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const text=await response.text();
  fs.appendFileSync(`${cfg.run}/http.jsonl`,JSON.stringify({time:new Date().toISOString(),service,method,url,expected:status,status:response.status,response:text})+'\n');
  assert(response.status===status,`${service} ${method} ${url}: expected ${status}, got ${response.status} ${text}`);
  return text?JSON.parse(text):null;
}
async function until(action,predicate,label,seconds=90){
  const end=Date.now()+seconds*1000;let result;
  do{result=await action();if(predicate(result))return result;await sleep(500);}while(Date.now()<end);
  throw Error(`Timeout: ${label}; last=${JSON.stringify(result)}`);
}
if(mode==='proxy'){
  let behavior='pass';let forwarded=0;let orderForwarded=0;
  http.createServer((req,res)=>{
    if(req.url==='/hold'){behavior='hold';forwarded=0;}else if(req.url==='/block'){behavior='block';forwarded=0;}else if(req.url==='/pass'){behavior='pass';}
    res.end(JSON.stringify({behavior,forwarded,orderForwarded}));
  }).listen(cfg.ports.control,'127.0.0.1');
  http.createServer((req,res)=>{
    if(behavior==='block'){res.statusCode=503;res.end();return;}
    const hold=behavior==='hold';
    const upstream=http.request({hostname:'127.0.0.1',port:cfg.ports['inventory-service'],path:req.url,method:req.method,headers:req.headers},reply=>{
      forwarded++;
      if(hold){reply.resume();const timer=setTimeout(()=>res.destroy(),12000);res.on('close',()=>clearTimeout(timer));}
      else{res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);}
    });
    upstream.on('error',()=>{res.statusCode=503;res.end();});req.pipe(upstream);
  }).listen(cfg.ports.proxy,'127.0.0.1');
  if(cfg.ports.orderDrop)http.createServer((req,res)=>{
    const upstream=http.request({hostname:'127.0.0.1',port:cfg.ports['order-service'],path:req.url,method:req.method,headers:req.headers},reply=>{
      reply.resume();reply.on('end',()=>{orderForwarded++;setTimeout(()=>res.destroy(),15000);});
    });upstream.on('error',()=>res.destroy());req.pipe(upstream);
  }).listen(cfg.ports.orderDrop,'127.0.0.1');
}else{
  try{
    if(mode==='cases'){
      const capabilities=await api('payment','payments/capabilities');
      assert(capabilities.processingEnabled===false,'Provider processing must remain disabled');
      const mappings=await api('catalog','store-products');const selections=[];
      for(const mapping of mappings){
        if(!mapping.available||selections.some(x=>x.storeId===mapping.storeId))continue;
        const store=await api('catalog',`stores/${mapping.storeId}`);
        if(!store.active||!store.pickupEnabled||store.status!=='Active')continue;
        const product=await api('catalog',`products/${mapping.productId}`);
        const variant=product.variants?.find(x=>x.active&&Number(x.price)>0);
        if(product.status!=='ACTIVE'||!variant)continue;
        selections.push({storeId:mapping.storeId,item:{productId:product.id,variantId:variant.id,productName:product.name,quantity:1,unitPrice:Number(mapping.priceOverride??variant.price)}});
        if(selections.length===3)break;
      }
      assert(selections.length===3,`Need three real eligible catalog stores; found ${selections.length}`);
      fs.writeFileSync(`${cfg.run}/fixtures.json`,JSON.stringify(selections,null,2));
      // Stock fixture writes are restricted to the UUID-verified fresh clone.
      for(const x of selections)sql(`INSERT INTO ${db('inventory')}.inventories(id,product_id,variant_id,variant_key,store_id,available_quantity,reserved_quantity,reorder_level,status,version,created_at,updated_at) VALUES(UNHEX('${hex(crypto.randomUUID())}'),UNHEX('${hex(x.item.productId)}'),UNHEX('${hex(x.item.variantId)}'),UNHEX('${hex(x.item.variantId)}'),'${x.storeId.replaceAll("'","''")}',100,0,0,'ACTIVE',0,NOW(6),NOW(6)) ON DUPLICATE KEY UPDATE available_quantity=100,reserved_quantity=0,status='ACTIVE'`);
      const owner=crypto.randomUUID(),foreign=crypto.randomUUID();
      async function payload(count){
        const stores=[];
        for(const x of selections.slice(0,count)){
          let cart=await api('cart','carts',{owner,body:{customerId:owner,storeId:x.storeId},status:201});
          await api('cart',`carts/${cart.id}/items`,{owner,body:x.item,key:crypto.randomUUID()});
          stores.push({customerId:owner,cartId:cart.id,storeId:x.storeId,items:[x.item],deliveryMethod:'pickup',fulfillmentType:'pickup'});
        }return {stores};
      }
      async function complete(body,label,timeout=false){
        const key=crypto.randomUUID();
        const stockBefore=body.stores.map(x=>Number(sql(`SELECT available_quantity FROM ${db('inventory')}.inventories WHERE store_id='${x.storeId.replaceAll("'","''")}' AND product_id=UNHEX('${hex(x.items[0].productId)}') AND variant_key=UNHEX('${hex(x.items[0].variantId)}')`)));
        if(timeout)await fetch(`http://127.0.0.1:${cfg.ports.control}/hold`);
        let first;
        if(timeout&&cfg.ports.orderDrop){
          let lost=false;
          try{await fetch(`http://127.0.0.1:${cfg.ports.orderDrop}/api/v1/checkouts`,{method:'POST',headers:{Authorization:`Bearer ${token(owner)}`,'Idempotency-Key':key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(7000)});}catch(error){lost=error.name==='TimeoutError';}
          assert(lost,'Expected actual checkout HTTP response timeout');
          first=await until(async()=>{try{return await api('order',`checkouts/by-key/${key}`,{owner});}catch{return null;}},x=>!!x,'unknown-outcome owner lookup');
          await until(async()=>await (await fetch(`http://127.0.0.1:${cfg.ports.control}/status`)).json(),x=>x.orderForwarded>0,'checkout response actually dropped');
        }else first=await api('order','checkouts',{owner,key,body});
        if(timeout){
          await until(()=>Promise.resolve(sql(`SELECT COUNT(*) FROM ${db('order')}.sync_outbox WHERE aggregate_id='${first.id}' AND target='inventory-service' AND attempts>0 AND last_error='HttpTimeoutException'`)),x=>Number(x)>0,'actual lost response HTTP timeout',30);
          const proxy=await (await fetch(`http://127.0.0.1:${cfg.ports.control}/status`)).json();assert(proxy.forwarded>0,'Timeout must follow real Inventory processing');
          await fetch(`http://127.0.0.1:${cfg.ports.control}/pass`);
          await api('order',`checkouts/${first.id}/retry`,{owner,body:{}});
        }
        const group=await until(()=>api('order',`checkouts/${first.id}`,{owner}),x=>x.state==='COMPLETED',label);
        assert(group.children.length===body.stores.length,'Missing child');
        const persistedGroup=sql(`SELECT state,aggregate_total FROM ${db('order')}.checkout_groups WHERE id='${group.id}' AND customer_id='${owner}'`).split('\t');
        assert(persistedGroup[0]==='COMPLETED'&&Number(persistedGroup[1])===Number(group.aggregateTotal),'Group API result differs from database');
        assert(Number(sql(`SELECT COUNT(*) FROM ${db('order')}.checkout_children WHERE checkout_id='${group.id}' AND order_id IS NOT NULL`))===body.stores.length,'Persisted child count differs');
        assert(Math.round(Number(group.aggregateTotal)*100)===body.stores.reduce((s,x)=>s+Math.round(x.items[0].unitPrice*100)+500,0),'Aggregate mismatch');
        const retry=await api('order','checkouts',{owner,key,body});assert(retry.id===group.id,'Retry duplicated checkout');
        for(let i=0;i<body.stores.length;i++){
          const x=body.stores[i];const after=sql(`SELECT available_quantity,reserved_quantity FROM ${db('inventory')}.inventories WHERE store_id='${x.storeId.replaceAll("'","''")}' AND product_id=UNHEX('${hex(x.items[0].productId)}') AND variant_key=UNHEX('${hex(x.items[0].variantId)}')`).split('\t').map(Number);
          assert(after[0]===stockBefore[i]-1&&after[1]===0,'Retry/lost response duplicated stock decrement or retained reserved stock');
        }
        assert(Number(sql(`SELECT COUNT(*) FROM ${db('inventory')}.checkout_reservations WHERE checkout_id='${group.id}' AND state='CONFIRMED'`))===body.stores.length,'Reservation count/state mismatch');
        const byKey=await api('order',`checkouts/by-key/${key}`,{owner});assert(byKey.id===group.id,'By-key recovery mismatch');
        const changed=structuredClone(body);changed.stores[0].pickupDetails='changed retry content';
        await api('order','checkouts',{owner,key,body:changed,status:409});
        await api('order','checkouts',{owner,key:crypto.randomUUID(),body,status:409});
        await api('order',`checkouts/${group.id}`,{status:401});
        await api('order',`checkouts/${group.id}`,{owner:foreign,status:403});
        await api('order',`checkouts/${group.id}/retry`,{owner:foreign,body:{},status:403});
        await api('order',`checkouts/by-key/${key}`,{owner:foreign,status:404});
        const payments=[],dbPayments=[];
        for(const child of group.children){
          const persistedOrder=sql(`SELECT store_id,handling_fee,total_amount FROM ${db('order')}.orders WHERE id=UNHEX('${hex(child.orderId)}') AND customer_id=UNHEX('${hex(owner)}')`).split('\t');
          assert(persistedOrder[0]===child.storeId&&Number(persistedOrder[1])===5&&Number(persistedOrder[2])===Number(child.total),'Saved order owner/store/fee/total mismatch');
          await api('cart',`carts/${child.cartId}`,{owner:foreign,status:403});
          const cartStore=body.stores.find(x=>x.cartId===child.cartId);
          await api('cart',`carts/${child.cartId}/items`,{owner,body:cartStore.items[0],key:crypto.randomUUID(),status:409});
          assert(child.state==='CONFIRMED'&&Number(child.handlingFee)===5,'Unconfirmed child/fee');
          const payment=await until(async()=>{try{return await api('payment',`payments/order/${child.orderId}`,{owner});}catch{return null;}},x=>x?.status==='PENDING','pending payment');
          assert(payment.orderId===child.orderId&&payment.customerId===owner&&Number(payment.amount)===Number(child.total),'Payment identity/amount mismatch');
          const rows=sql(`SELECT HEX(id),HEX(customer_id),amount,status FROM ${db('payment')}.payments WHERE order_id=UNHEX('${hex(child.orderId)}')`).split('\t');
          assert(rows[0]?.toLowerCase()===hex(payment.id)&&rows[1]?.toLowerCase()===hex(owner)&&Number(rows[2])===Number(child.total)&&rows[3]==='PENDING','DB payment UUID mismatch');
          dbPayments.push({orderId:child.orderId,row:rows});
          await api('payment',`payments/order/${child.orderId}`,{owner:foreign,status:403});payments.push(payment);
        }
        evidence.push({label,state:'PASS',owner,key,group,payments,dbPayments});save();
      }
      const firstBody=await payload(2);
      await api('order','checkouts',{key:crypto.randomUUID(),body:firstBody,status:401});
      const spoofed=structuredClone(firstBody);spoofed.stores[0].customerId=foreign;
      await api('order','checkouts',{owner,key:crypto.randomUUID(),body:spoofed,status:403});
      await complete(firstBody,'two-store');
      await complete(await payload(3),'three-store-lost-response',true);
      const failedBody=await payload(2),bad=selections[1];
      const domainCounts=()=>sql(`SELECT (SELECT COUNT(*) FROM ${db('order')}.orders WHERE customer_id=UNHEX('${hex(owner)}')),(SELECT COUNT(*) FROM ${db('payment')}.payments WHERE customer_id=UNHEX('${hex(owner)}'))`);
      const beforeCounts=domainCounts();
      const before=sql(`SELECT HEX(id),available_quantity,reserved_quantity FROM ${db('inventory')}.inventories WHERE store_id='${selections[0].storeId.replaceAll("'","''")}' AND product_id=UNHEX('${hex(selections[0].item.productId)}')`);
      sql(`UPDATE ${db('inventory')}.inventories SET available_quantity=0 WHERE store_id='${bad.storeId.replaceAll("'","''")}' AND product_id=UNHEX('${hex(bad.item.productId)}') AND variant_key=UNHEX('${hex(bad.item.variantId)}')`);
      const failed=await api('order','checkouts',{owner,key:crypto.randomUUID(),body:failedBody});
      const terminal=await until(()=>api('order',`checkouts/${failed.id}`,{owner}),x=>x.state==='FAILED','compensation');
      assert(terminal.children.every(x=>x.orderId===null&&x.state==='RELEASED'),'Compensation created orders or unreleased child');
      assert(beforeCounts===domainCounts(),'Compensated failure created orders/payments');
      assert(before===sql(`SELECT HEX(id),available_quantity,reserved_quantity FROM ${db('inventory')}.inventories WHERE store_id='${selections[0].storeId.replaceAll("'","''")}' AND product_id=UNHEX('${hex(selections[0].item.productId)}')`),'Compensation did not restore exact stock');
      evidence.push({label:'insufficient-stock-compensation',state:'PASS',owner,group:terminal});save();
      sql(`UPDATE ${db('inventory')}.inventories SET available_quantity=100 WHERE store_id='${bad.storeId.replaceAll("'","''")}' AND product_id=UNHEX('${hex(bad.item.productId)}') AND variant_key=UNHEX('${hex(bad.item.variantId)}')`);
      const insertionBody=await payload(2),insertionKey=crypto.randomUUID();
      const secondStore=[...insertionBody.stores].sort((a,b)=>a.storeId.localeCompare(b.storeId))[1].storeId.replaceAll("'","''");
      // A nontransactional test ledger proves the first SQL insert was attempted before the second failed.
      // Both fixtures exist only in the UUID-verified restored Order clone, never in source/live schemas.
      sql(`CREATE TABLE IF NOT EXISTS ${db('order')}.qa_child_attempts (checkout_key VARCHAR(36),store_id VARCHAR(100)) ENGINE=MyISAM`);
      sql(`DROP TRIGGER IF EXISTS ${db('order')}.qa_fail_second_child`);
      sql(`DELIMITER $$\nCREATE TRIGGER ${db('order')}.qa_fail_second_child BEFORE INSERT ON ${db('order')}.orders FOR EACH ROW BEGIN IF NEW.customer_id=UNHEX('${hex(owner)}') THEN INSERT INTO ${db('order')}.qa_child_attempts VALUES ('${insertionKey}',NEW.store_id); IF NEW.store_id='${secondStore}' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Isolated second child insertion failure'; END IF; END IF; END$$\nDELIMITER ;`);
      let insertion;
      try {
        insertion=await api('order','checkouts',{owner,key:insertionKey,body:insertionBody});
        await until(()=>Promise.resolve(sql(`SELECT COUNT(DISTINCT store_id) FROM ${db('order')}.qa_child_attempts WHERE checkout_key='${insertionKey}'`)),x=>Number(x)===2,'second-child SQL failure');
        const failedInsert=await api('order',`checkouts/${insertion.id}`,{owner});
        assert(failedInsert.state==='RESERVING'&&failedInsert.children.every(x=>!x.orderId),'Partial child insertion was reported successful');
        assert(Number(sql(`SELECT COUNT(*) FROM ${db('order')}.checkout_children WHERE checkout_id='${insertion.id}' AND order_id IS NOT NULL`))===0,'Partial child link escaped rollback');
        assert(Number(sql(`SELECT COUNT(*) FROM ${db('order')}.orders WHERE customer_id=UNHEX('${hex(owner)}') AND cart_id IN (${insertionBody.stores.map(x=>`UNHEX('${hex(x.cartId)}')`).join(',')})`))===0,'First child insertion escaped rollback');
      } finally {sql(`DROP TRIGGER IF EXISTS ${db('order')}.qa_fail_second_child`);}
      await api('order',`checkouts/${insertion.id}/retry`,{owner,body:{}});
      const insertionRecovered=await until(()=>api('order',`checkouts/${insertion.id}`,{owner}),x=>x.state==='COMPLETED','partial SQL insertion recovery');
      const insertionPayments=[];
      for(const child of insertionRecovered.children){
        const payment=await until(async()=>{try{return await api('payment',`payments/order/${child.orderId}`,{owner});}catch{return null;}},x=>x?.status==='PENDING','partial SQL recovery payment');
        assert(sql(`SELECT HEX(id) FROM ${db('payment')}.payments WHERE order_id=UNHEX('${hex(child.orderId)}')`).toLowerCase()===hex(payment.id),'Partial recovery payment DB mismatch');
        insertionPayments.push(payment);
      }
      assert(Number(sql(`SELECT COUNT(*) FROM ${db('order')}.checkout_children WHERE checkout_id='${insertion.id}' AND order_id IS NOT NULL`))===2,'Partial recovery duplicated child');
      evidence.push({label:'second-child-insert-rollback-and-recovery',state:'PASS',owner,key:insertionKey,group:insertionRecovered,payments:insertionPayments});save();
      await fetch(`http://127.0.0.1:${cfg.ports.control}/block`);
      const recoveryBody=await payload(2),recoveryKey=crypto.randomUUID();
      const pending=await api('order','checkouts',{owner,key:recoveryKey,body:recoveryBody});
      await until(()=>Promise.resolve(sql(`SELECT COUNT(*) FROM ${db('order')}.sync_outbox WHERE aggregate_id='${pending.id}' AND target='inventory-service' AND attempts>0`)),x=>Number(x)>0,'durable unavailable receiver');
      assert((await api('order',`checkouts/${pending.id}`,{owner})).state==='RESERVING','Expected durable pending group before restart');
      evidence.push({label:'restart-pending',state:'PENDING',owner,key:recoveryKey,body:recoveryBody,group:pending});save();
    }else if(mode==='verify'){
      evidence.push(...JSON.parse(fs.readFileSync(`${cfg.run}/cases.json`,'utf8')));
      for(const item of evidence){
        if(item.label==='restart-pending'){
          await fetch(`http://127.0.0.1:${cfg.ports.control}/pass`);
          const lookup=await api('order',`checkouts/by-key/${item.key}`,{owner:item.owner});assert(lookup.id===item.group.id,'Restart lost by-key lookup');
          await api('order',`checkouts/${item.group.id}/retry`,{owner:item.owner,body:{}});
          const recovered=await until(()=>api('order',`checkouts/${item.group.id}`,{owner:item.owner}),x=>x.state==='COMPLETED','pending sender/receiver restart recovery');
          for(const child of recovered.children){
            const payment=await until(async()=>{try{return await api('payment',`payments/order/${child.orderId}`,{owner:item.owner});}catch{return null;}},x=>x?.status==='PENDING','recovered payment');
            const actual=sql(`SELECT HEX(id),amount,status FROM ${db('payment')}.payments WHERE order_id=UNHEX('${hex(child.orderId)}')`).split('\t');
            assert(actual[0]?.toLowerCase()===hex(payment.id)&&Number(actual[1])===Number(child.total)&&actual[2]==='PENDING','Recovered DB payment UUID mismatch');
          }
          assert(Number(sql(`SELECT COUNT(*) FROM ${db('inventory')}.checkout_reservations WHERE checkout_id='${item.group.id}' AND state='CONFIRMED'`))===2,'Restart duplicated/lost reservations');
          item.group=recovered;item.state='PASS';continue;
        }
        const current=await api('order',`checkouts/${item.group.id}`,{owner:item.owner});
        const stable=({recoveryRequired,...value})=>value;
        assert(JSON.stringify(stable(current))===JSON.stringify(stable(item.group)),'Restart changed group');
        for(const payment of item.payments??[]){const recovered=await api('payment',`payments/order/${payment.orderId}`,{owner:item.owner});assert(recovered.id===payment.id&&recovered.status==='PENDING','Restart changed payment UUID');}
      }
      evidence.push({label:'four-owned-service-restarts',state:'PASS'});save();
      if(fs.existsSync(`${cfg.run}/browser.request`)){
        console.log(`API_AND_RESTART_VERIFIED; owned stack retained for browser; create ${cfg.run}/browser.done after browser result`);
        const deadline=Date.now()+15*60*1000;
        while(!fs.existsSync(`${cfg.run}/browser.done`)){
          assert(Date.now()<deadline,'Browser evidence marker timeout; browser NOT VERIFIED');await sleep(1000);
        }
      }
    }else if(mode==='database'){
      const cases=JSON.parse(fs.readFileSync(`${cfg.run}/cases.json`,'utf8'));
      for(const item of cases.filter(x=>x.group)){
        const group=item.group;hex(group.id);hex(item.owner);
        const actual=sql(`SELECT customer_id,state,aggregate_total FROM ${db('order')}.checkout_groups WHERE id='${group.id}'`).split('\t');
        assert(actual[0]===item.owner&&actual[1]===group.state,'Persisted group owner/state mismatch');
        if(group.state==='COMPLETED')assert(Number(actual[2])===Number(group.aggregateTotal),'Persisted aggregate mismatch');
        assert(Number(sql(`SELECT COUNT(*) FROM ${db('order')}.checkout_children WHERE checkout_id='${group.id}'`))===group.children.length,'Persisted group child count mismatch');
        assert(Number(sql(`SELECT COUNT(*) FROM ${db('order')}.checkout_audit WHERE checkout_id='${group.id}'`))>0,'Checkout audit missing');
        for(const child of group.children){
          if(!child.orderId){assert(group.state==='FAILED','Unresolved child in successful evidence');continue;}
          const row=sql(`SELECT store_id,handling_fee,total_amount FROM ${db('order')}.orders WHERE id=UNHEX('${hex(child.orderId)}') AND customer_id=UNHEX('${hex(item.owner)}')`).split('\t');
          assert(row[0]===child.storeId&&Number(row[1])===5&&Number(row[2])===Number(child.total),'Child database ownership/totals mismatch');
          const payment=await api('payment',`payments/order/${child.orderId}`,{owner:item.owner});
          assert(payment.status==='PENDING','Unexpected payment settlement');
          assert(sql(`SELECT HEX(id) FROM ${db('payment')}.payments WHERE order_id=UNHEX('${hex(child.orderId)}')`).toLowerCase()===hex(payment.id),'Payment UUID missing from DB');
        }
        evidence.push({label:item.label,state:'PASS',checkoutId:group.id});
      }
      fs.writeFileSync(`${cfg.run}/database-verification.json`,JSON.stringify(evidence,null,2));
      console.log(JSON.stringify(evidence));
      process.exit(0);
    }else throw Error('Unknown mode');
    console.log(JSON.stringify(evidence.map(({label,state})=>({label,state}))));
  }catch(error){evidence.push({label:mode,state:'FAIL',error:error.stack});save();console.error(error);process.exitCode=1;}
}
