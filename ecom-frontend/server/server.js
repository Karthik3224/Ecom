import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { calculateOrderAmount } from './catalog.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => { const index=line.indexOf('=');if(index>0&&!line.trim().startsWith('#')) process.env[line.slice(0,index).trim()] ||= line.slice(index+1).trim(); });
const port = Number(process.env.PAYMENT_API_PORT || 3001);
const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const dataDir = path.join(root, 'server', 'data');
const dataFile = path.join(dataDir, 'payments.json');
fs.mkdirSync(dataDir, { recursive:true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');
const readPayments = () => JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const writePayments = (records) => fs.writeFileSync(dataFile, JSON.stringify(records, null, 2));
const send = (res, status, body) => { res.writeHead(status, { 'content-type':'application/json' });res.end(JSON.stringify(body)); };
const body = (req) => new Promise((resolve,reject) => { let value='';req.on('data',(chunk)=>{value+=chunk;if(value.length>1e6)reject(new Error('Request too large.'));});req.on('end',()=>{try{resolve(value?JSON.parse(value):{});}catch(error){reject(error);}}); });
const authenticate = (req) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const userId = req.headers['x-user-id'];
  if (!token || !userId || token !== `local-${userId}`) throw new Error('Unauthorized payment request.');
  return String(userId);
};
const configured = () => keyId.startsWith('rzp_test_') && keySecret.length > 8;

const server = http.createServer(async (req,res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/payments/config') return send(res,200,{ configured:configured(),keyId:configured()?keyId:null,mode:'test' });
    const userId = authenticate(req);
    if (req.method === 'POST' && req.url === '/api/payments/create-order') {
      if (!configured()) return send(res,503,{ error:'Razorpay Test Mode keys are not configured on the server.' });
      const input = await body(req);
      const totals = calculateOrderAmount(input);
      const response = await fetch('https://api.razorpay.com/v1/orders', { method:'POST',headers:{ authorization:`Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,'content-type':'application/json' },body:JSON.stringify({ amount:totals.total*100,currency:'INR',receipt:`receipt_${Date.now()}`,notes:{userId} }) });
      const razorpayOrder = await response.json();
      if (!response.ok) throw new Error(razorpayOrder.error?.description || 'Razorpay order creation failed.');
      const payment = { id:crypto.randomUUID(),userId,orderId:input.localOrderId,razorpayOrderId:razorpayOrder.id,amount:totals.total,currency:'INR',status:'PENDING',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() };
      writePayments([payment,...readPayments()]);
      return send(res,201,{ paymentId:payment.id,keyId,razorpayOrderId:razorpayOrder.id,amount:razorpayOrder.amount,currency:'INR',totals });
    }
    if (req.method === 'POST' && req.url === '/api/payments/verify') {
      const input = await body(req);
      const payments = readPayments();
      const payment = payments.find((item)=>item.id===input.paymentId && item.userId===userId);
      if (!payment) return send(res,404,{error:'Payment record not found.'});
      if (payment.status === 'PAID') return send(res,200,payment);
      if (payment.razorpayOrderId !== input.razorpay_order_id) return send(res,400,{error:'Payment order mismatch.'});
      const expected = crypto.createHmac('sha256',keySecret).update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`).digest('hex');
      const received = String(input.razorpay_signature || '');
      const valid = received.length===expected.length && crypto.timingSafeEqual(Buffer.from(received),Buffer.from(expected));
      if (!valid) return send(res,400,{error:'Razorpay signature verification failed.'});
      Object.assign(payment,{razorpayPaymentId:input.razorpay_payment_id,razorpaySignature:received,status:'PAID',updatedAt:new Date().toISOString()});
      writePayments(payments);
      return send(res,200,payment);
    }
    if (req.method === 'POST' && req.url === '/api/payments/cancel') {
      const input=await body(req);const payments=readPayments();const payment=payments.find((item)=>item.id===input.paymentId&&item.userId===userId);
      if (!payment)return send(res,404,{error:'Payment record not found.'});if(payment.status!=='PAID')Object.assign(payment,{status:'CANCELLED',updatedAt:new Date().toISOString()});writePayments(payments);return send(res,200,payment);
    }
    if (req.method === 'POST' && req.url === '/api/payments/fail') {
      const input=await body(req);const payments=readPayments();const payment=payments.find((item)=>item.id===input.paymentId&&item.userId===userId);
      if (!payment)return send(res,404,{error:'Payment record not found.'});if(payment.status!=='PAID')Object.assign(payment,{status:'FAILED',failureReason:String(input.reason || 'Razorpay reported a failed payment.').slice(0,500),updatedAt:new Date().toISOString()});writePayments(payments);return send(res,200,payment);
    }
    if (req.method === 'GET' && req.url.startsWith('/api/payments/')) {
      const id=decodeURIComponent(req.url.split('/').pop());const payment=readPayments().find((item)=>item.id===id&&item.userId===userId);return payment?send(res,200,payment):send(res,404,{error:'Payment record not found.'});
    }
    return send(res,404,{error:'Not found.'});
  } catch (error) { return send(res,error.message.startsWith('Unauthorized')?401:400,{error:error.message}); }
});

server.listen(port,'127.0.0.1',()=>console.log(`Payment API listening on http://127.0.0.1:${port}`));
