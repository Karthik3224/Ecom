import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { AlertQueue, evaluateSignals } from './operationalAlerts.mjs';

const execute = promisify(execFile);
const mysql = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe';
const query = async sql => (await execute(mysql, ['--no-defaults', '--host=127.0.0.1', '--port=14306', '--user=root', '--batch', '--skip-column-names', `--execute=${sql}`])).stdout.trim();
if (process.argv[2] !== '--isolated') throw new Error('Explicit isolated monitoring mode required; production is not configured');
if (await query('SELECT @@server_uuid') !== '580d1315-c4bf-11f1-bf4b-14cb19888cfa') throw new Error('Wrong isolated monitor database');
const ports = { eureka:18761, config:18888, auth:13310, profile:18088, catalog:18089, inventory:18095, cart:18091, notification:13317, fulfillment:13315, payment:13314, order:13311, gateway:18082 };
const unhealthyServices = [];
for (const [name,port] of Object.entries(ports)) {
  try { const response=await fetch(`http://127.0.0.1:${port}/actuator/health`,{signal:AbortSignal.timeout(3000)});if(!response.ok || (await response.json()).status!=='UP')unhealthyServices.push(name); }
  catch { unhealthyServices.push(name); }
}
let exhausted=0,stuck=0,synchronizationFailures=0;
for (const schema of ['order-service','payment_service','fulfillment-service','notification_service']) {
  const rows=(await query(`SELECT SUM(state='DEAD'), SUM(state='PENDING' AND next_attempt < UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3))*1000-900000), SUM(state='PENDING' AND attempts>=3) FROM \`${schema}\`.sync_outbox`)).split('\t');
  exhausted+=Number(rows[0])||0;stuck+=Number(rows[1])||0;synchronizationFailures+=Number(rows[2])||0;
}
const disk=await execute('powershell',['-NoProfile','-Command',"(Get-PSDrive -Name C).Free"]);
const signals=evaluateSignals({unhealthyServices,exhausted,stuck,synchronizationFailures,freeDiskBytes:Number(disk.stdout.trim())});
const queue=new AlertQueue(resolve('.local/operational-alert-queue.json'));
await queue.enqueue(signals);
console.log(JSON.stringify({unhealthyServices,exhausted,stuck,synchronizationFailures,signalCount:signals.length}));
if (process.env.APPROVED_TEST_ALERT_URL) {
  const deliveries=await queue.deliver(process.env.APPROVED_TEST_ALERT_URL,process.env.TEST_ALERT_BEARER||'');
  console.log(JSON.stringify({delivered:deliveries.filter(row=>row.state==='DELIVERED').length,pending:deliveries.filter(row=>row.state==='PENDING').length}));
} else console.log('External alert destination not configured; delivery NOT VERIFIED');
