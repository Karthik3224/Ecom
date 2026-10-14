import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const read = sql => execFileSync('C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe', ['--no-defaults', '--host=127.0.0.1', '--port=14306', '--user=root', '--batch', '--execute=' + sql], { encoding: 'utf8', timeout: 30000 });
assert.equal(read('SELECT @@server_uuid').trim().split('\n').at(-1).trim(), '580d1315-c4bf-11f1-bf4b-14cb19888cfa');
const id='a680ecbf-5228-4c32-903b-d303c328d612';
const sql=`SELECT g.id,g.state,g.aggregate_total,c.store_id,c.state AS child_state,BIN_TO_UUID(o.id) AS order_uid,o.status,o.total_amount,o.handling_fee,BIN_TO_UUID(p.id) AS payment_uid,p.status AS payment_status,p.amount,
 (SELECT COUNT(*) FROM qual_99b106e3_order.order_items i WHERE i.order_id=o.id) AS saved_items,
 (SELECT COUNT(*) FROM qual_99b106e3_order.order_addresses a WHERE a.order_id=o.id) AS saved_addresses
 FROM qual_99b106e3_order.checkout_groups g JOIN qual_99b106e3_order.checkout_children c ON c.checkout_id=g.id
 JOIN qual_99b106e3_order.orders o ON o.id=UUID_TO_BIN(c.order_id)
 JOIN qual_99b106e3_payment.payments p ON p.order_id=o.id AND p.customer_id=o.customer_id
 WHERE g.id='${id}';`;
const output=read(sql); const lines=output.trim().split(/\r?\n/); assert.equal(lines.length,3,'Exactly two persisted children and linked payments');
for(const line of lines.slice(1)){const fields=line.split('\t');assert.equal(fields[1],'COMPLETED');assert.equal(fields[4],'CONFIRMED');assert.equal(Number(fields[8]),5);assert.equal(fields[10],'PENDING');assert.equal(Number(fields[7]),Number(fields[11]));assert.ok(Number(fields[12])>0);assert.ok(Number(fields[13])>0);}
writeFileSync('.local/client-checkout-records.tsv',output);console.log(output);console.log('PASS two persisted child orders, linked unique pending payments, snapshots and per-store handling fees');
