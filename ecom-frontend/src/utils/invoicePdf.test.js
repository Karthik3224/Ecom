import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvoicePdf, invoiceFileName, invoiceLines } from './invoicePdf.js';
test('invoice PDF reflects saved order data and pending payment', async () => {
  const order={id:'order-1',orderNumber:'ORD-1',status:'CREATED',paymentStatus:'PENDING',subtotal:100,deliveryCharge:20,handlingFee:5,totalAmount:125,items:[{title:'Pickle',quantity:1,totalPrice:100}]};
  assert.equal(invoiceFileName(order),'invoice-ORD-1.pdf');
  assert.ok(invoiceLines(order,{}).includes('Payment status: PENDING'));
  assert.match(await createInvoicePdf(order,{}).text(),/^%PDF-1.4/);
});
