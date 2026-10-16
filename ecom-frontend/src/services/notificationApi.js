import { serviceBaseUrl } from './apiConfig.js';
import { apiRequest } from './apiClient';

export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED', 'CANCELLED'];
export const NOTIFICATION_CHANNELS = ['EMAIL', 'SMS', 'PUSH'];
export const NOTIFICATION_TYPES = [
  'ORDER_CREATED',
  'ORDER_STATUS_UPDATED',
  'ORDER_CANCELLED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
  'FULFILLMENT_CREATED',
  'SHIPMENT_CREATED',
  'SHIPMENT_DELIVERED',
];

const NOTIFICATION_BASE_URL = serviceBaseUrl(import.meta.env, 'VITE_NOTIFICATION_URL', '/notification-service');

const request = (path, options = {}) => apiRequest(NOTIFICATION_BASE_URL, path, options);

export const isNotificationServiceUnavailable = (error) => error?.name === 'TypeError' || Number(error?.status) >= 500;

export const createNotification = async (data) =>
  request('/api/v1/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getNotificationsByOrder = async (orderId, page = 0, size = 20) =>
  request(`/api/v1/notifications/order/${encodeURIComponent(orderId)}?page=${page}&size=${size}`);

export const getNotificationsByCustomer = async (customerId, page = 0, size = 20) =>
  request(`/api/v1/notifications/customer/${encodeURIComponent(customerId)}?page=${page}&size=${size}`);

export const getNotificationHistory = async (page = 0, size = 20) =>
  request(`/api/v1/notifications/history?page=${page}&size=${size}`);

export const getNotificationTemplates = async (page = 0, size = 20) =>
  request(`/api/v1/notification-templates?page=${page}&size=${size}`);

export const sendNotification = async (notificationId, data = {}) =>
  request(`/api/v1/notifications/${encodeURIComponent(notificationId)}/send`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const normalizeNotification = (notification = {}) => ({
  ...notification,
  id: notification.id || notification.notificationId || '',
  customerId: notification.customerId || '',
  orderId: notification.orderId || '',
  notificationType: NOTIFICATION_TYPES.includes(notification.notificationType) ? notification.notificationType : notification.notificationType || '',
  channel: NOTIFICATION_CHANNELS.includes(notification.channel) ? notification.channel : notification.channel || '',
  recipient: notification.recipient || '',
  subject: notification.subject || '',
  message: notification.message || '',
  status: NOTIFICATION_STATUSES.includes(notification.status) ? notification.status : notification.status || 'PENDING',
  sentAt: notification.sentAt || null,
  createdAt: notification.createdAt || '',
});
