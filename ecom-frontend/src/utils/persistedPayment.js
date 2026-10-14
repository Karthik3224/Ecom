export const verifyPersistedPayment = (payment, orderId, customerId, total) => {
  const id = payment?.id;
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id || '')
    || payment.orderId !== orderId || payment.customerId !== customerId
    || !Number.isFinite(Number(payment.amount)) || Number(payment.amount) <= 0
    || Math.round(Number(payment.amount) * 100) !== Math.round(Number(total) * 100)
    || !['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'].includes(payment.status)) {
    throw new Error('Payment record does not match the saved order.');
  }
  return payment;
};
