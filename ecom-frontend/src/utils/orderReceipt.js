export const receiptRows = (order = {}) => {
  const rows = [];
  for (const [key, label] of [['subtotal', 'Item subtotal'], ['deliveryCharge', 'Delivery fee'], ['handlingFee', 'Handling fee'], ['taxAmount', 'Tax'], ['discountAmount', 'Discount']]) {
    if (order[key] !== null && order[key] !== undefined && Number.isFinite(Number(order[key]))) rows.push({ label, amount: Number(order[key]) });
  }
  return rows;
};
export const verifiedPaymentLabel = (payment) => {
  if (!payment) return 'Payment confirmation unavailable';
  return ({ SUCCESS: 'Payment confirmed', PAID: 'Payment confirmed', PENDING: 'Payment pending', FAILED: 'Payment failed', REFUNDED: 'Refund confirmed' })[payment.status] || 'Payment confirmation unavailable';
};
