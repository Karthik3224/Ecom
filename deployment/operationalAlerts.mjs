import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export const requiredSignals = ['service-failure', 'retry-exhaustion', 'stuck-outbox', 'synchronization-failure', 'disk-space'];

export const evaluateSignals = ({ unhealthyServices = [], exhausted = 0, stuck = 0, synchronizationFailures = 0, freeDiskBytes, minimumDiskBytes = 2147483648 }) => {
  const signals = [];
  if (unhealthyServices.length) signals.push({ type: 'service-failure', services: unhealthyServices });
  if (exhausted > 0) signals.push({ type: 'retry-exhaustion', count: exhausted });
  if (stuck > 0) signals.push({ type: 'stuck-outbox', count: stuck });
  if (synchronizationFailures > 0) signals.push({ type: 'synchronization-failure', count: synchronizationFailures });
  if (Number.isFinite(freeDiskBytes) && freeDiskBytes < minimumDiskBytes) signals.push({ type: 'disk-space', freeDiskBytes });
  return signals;
};

export class AlertQueue {
  constructor(file) { this.file = file; }
  async read() {
    try { return JSON.parse(await readFile(this.file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }
  async save(rows) {
    await mkdir(dirname(this.file), { recursive: true });
    const temporary = `${this.file}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(rows), { flag: 'wx', mode: 0o600 });
    await rename(temporary, this.file);
  }
  async enqueue(signals) {
    const rows = await this.read();
    for (const signal of signals) {
      if (!requiredSignals.includes(signal.type)) throw new Error('Unrecognized operational signal');
      const id = createHash('sha256').update(JSON.stringify(signal)).digest('hex');
      if (!rows.some(row => row.id === id)) rows.push({ id, signal, state: 'PENDING', attempts: 0, createdAt: new Date().toISOString() });
    }
    await this.save(rows);
  }
  async deliver(destination, bearer = '') {
    const url = new URL(destination);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Approved HTTP destination required');
    if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('External alerts require HTTPS');
    const rows = await this.read();
    for (const row of rows.filter(row => row.state === 'PENDING')) {
      row.attempts++;
      try {
        const response = await fetch(url, {
          method: 'POST', signal: AbortSignal.timeout(5000),
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': row.id, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
          body: JSON.stringify({ id: row.id, signal: row.signal, createdAt: row.createdAt }),
        });
        if (!response.ok) throw new Error('Destination rejected delivery');
        const acknowledgement = await response.json();
        if (acknowledgement.id !== row.id || acknowledgement.accepted !== true) throw new Error('Unverified delivery acknowledgement');
        row.state = 'DELIVERED'; row.deliveredAt = new Date().toISOString(); delete row.lastError;
      } catch { row.lastError = 'Delivery not acknowledged; pending retry'; }
      await this.save(rows);
    }
    return rows.map(({ id, state, attempts }) => ({ id, state, attempts }));
  }
}
