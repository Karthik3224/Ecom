import { apiRequest } from './apiClient';

export const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];
export const PAYMENT_METHODS = ['DEMO_CARD', 'DEMO_UPI', 'DEMO_COD'];

const PAYMENT_BASE_URL = (import.meta.env.VITE_PAYMENT_URL || '/payment-service').replace(/\/$/, '');

const request = (path, options = {}) => apiRequest(PAYMENT_BASE_URL, path, options);
export const getPaymentCapabilities = () => request('/api/v1/payments/capabilities');

export const isPaymentServiceUnavailable = (error) => error?.name === 'TypeError' || Number(error?.status) >= 500;

export const normalizePayment = (payment = {}) => ({
  ...payment,
  id: payment.id || payment.paymentId || '',
  paymentId: payment.paymentId || payment.id || '',
  orderId: payment.orderId || '',
  customerId: payment.customerId || '',
  amount: Number(payment.amount ?? 0),
  currency: payment.currency || 'INR',
  paymentMethod: PAYMENT_METHODS.includes(payment.paymentMethod) ? payment.paymentMethod : '',
  status: PAYMENT_STATUSES.includes(payment.status) ? payment.status : 'PENDING',
  paymentReference: payment.paymentReference || payment.reference || '',
  transactionReference: payment.transactionReference || payment.transactionId || '',
});

export const createPayment = async (data) =>
  request('/api/v1/payments', { method: 'POST', body: JSON.stringify(data) });

export const getPayment = async (paymentId) =>
  request(`/api/v1/payments/${encodeURIComponent(paymentId)}`);

export const getPaymentByOrder = async (orderId) =>
  request(`/api/v1/payments/order/${encodeURIComponent(orderId)}`);

export const processDemoPayment = async (paymentId, status) =>
  request(`/api/v1/payments/${encodeURIComponent(paymentId)}/process-demo`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });

export const getPaymentStatus = async (paymentId) =>
  request(`/api/v1/payments/${encodeURIComponent(paymentId)}/status`);

export const refundDemoPayment = async (paymentId, data = {}) =>
  request(`/api/v1/payments/${encodeURIComponent(paymentId)}/refund-demo`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getPaymentTransactions = async (paymentId) =>
  request(`/api/v1/payments/${encodeURIComponent(paymentId)}/transactions`);
