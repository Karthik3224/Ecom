const clean = (value) => String(value ?? '').replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, ' ').trim();

const wrap = (text, length = 78) => {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (`${line} ${word}`.trim().length > length && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
};

export const invoiceFileName = (order = {}) => `invoice-${clean(order.orderNumber || order.id || 'order').replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`;

export const invoiceLines = (order = {}, payment = {}) => {
  const lines = [
    'SPICES AND PICKLES',
    'ORDER INVOICE',
    `Invoice reference: ${order.orderNumber || order.id || 'Unavailable'}`,
    `Order UID: ${order.id || 'Unavailable'}`,
    `Order date: ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'Unavailable'}`,
    `Order status: ${order.status || 'CREATED'}`,
    `Payment status: ${payment?.status || order.paymentStatus || 'PENDING'}`,
    payment?.id ? `Payment UID: ${payment.id}` : 'Payment UID: Pending service synchronization',
    '', 'ITEMS'
  ];
  for (const item of order.items || []) lines.push(`${item.quantity || 1} x ${item.title || item.productName || 'Product'} - Rs. ${Number(item.totalPrice ?? item.price ?? 0).toFixed(2)}`);
  lines.push('', `Item subtotal: Rs. ${Number(order.subtotal ?? 0).toFixed(2)}`);
  if (order.deliveryCharge != null) lines.push(`Delivery: Rs. ${Number(order.deliveryCharge).toFixed(2)}`);
  if (order.handlingFee != null) lines.push(`Handling: Rs. ${Number(order.handlingFee).toFixed(2)}`);
  lines.push(`TOTAL: Rs. ${Number(order.totalAmount ?? order.total ?? 0).toFixed(2)}`);
  const address = order.shippingAddress || order.addresses?.find((entry) => entry.addressType === 'SHIPPING');
  if (address) lines.push('', 'DELIVERY ADDRESS', ...wrap([address.recipientName, address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ')));
  lines.push('', 'This is an order invoice. It is not a tax invoice or proof of payment.');
  return lines;
};

export const createInvoicePdf = (order, payment) => {
  const lines = invoiceLines(order, payment);
  const stream = ['BT', '/F1 16 Tf', '54 790 Td', `(${clean(lines.shift() || '')}) Tj`, '/F1 10 Tf'];
  for (const line of lines) stream.push('0 -16 Td', `(${clean(line)}) Tj`);
  stream.push('ET');
  const content = stream.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
};

export const downloadInvoicePdf = (order, payment) => {
  const href = URL.createObjectURL(createInvoicePdf(order, payment));
  const anchor = document.createElement('a');
  anchor.href = href; anchor.download = invoiceFileName(order); anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 0);
};
