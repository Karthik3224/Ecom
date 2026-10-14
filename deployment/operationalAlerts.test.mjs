import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AlertQueue, evaluateSignals, requiredSignals } from './operationalAlerts.mjs';

test('all required operational signals reach a real local HTTP test receiver', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ecom-alert-test-'));
  const file = join(directory, 'pending.json');
  const accepted = new Set(); let unavailable = true;
  const server = createServer(async (request, response) => {
    let body = ''; for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    if (unavailable) { response.writeHead(503); response.end(); return; }
    assert.equal(request.headers['idempotency-key'], payload.id);
    accepted.add(payload.id);
    response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ id: payload.id, accepted: true }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const signals = evaluateSignals({ unhealthyServices: ['cart-service'], exhausted: 1, stuck: 1, synchronizationFailures: 1, freeDiskBytes: 1024 });
    assert.deepEqual(signals.map(signal => signal.type), requiredSignals);
    let queue = new AlertQueue(file); await queue.enqueue(signals);
    assert.ok((await queue.deliver(url, 'test-token-never-logged')).every(row => row.state === 'PENDING'));
    assert.ok(!(await readFile(file, 'utf8')).includes('test-token-never-logged'));
    unavailable = false;
    queue = new AlertQueue(file); // Recover persistent pending alerts after monitor restart.
    await queue.enqueue(signals);
    assert.ok((await queue.deliver(url)).every(row => row.state === 'DELIVERED' && row.attempts === 2));
    await queue.deliver(url); assert.equal(accepted.size, 5);
    console.log('Local test receiver acknowledged all five operational signal types; restart retry and deduplication PASS');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('healthy readings do not generate alerts', () => {
  assert.deepEqual(evaluateSignals({ freeDiskBytes: 10737418240 }), []);
});
test('corrupt queue state fails closed instead of discarding pending work', async () => {
  const { writeFile } = await import('node:fs/promises');
  const directory=await mkdtemp(join(tmpdir(), 'ecom-alert-corrupt-'));const file=join(directory,'queue.json');
  await writeFile(file,'corrupt');await assert.rejects(new AlertQueue(file).read());
});
