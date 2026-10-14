import { apiRequest } from './apiClient';
const ALERTS_BASE_URL = (import.meta.env.VITE_ALERTS_URL || '/alerts').replace(/\/$/, '');
export const alertsService = {
  health: () => apiRequest(ALERTS_BASE_URL, '/api/alerts/health', { auth:false }),
  sendTestEmail: (emailTo, subject, message) => apiRequest(ALERTS_BASE_URL, '/api/alerts/test-email', { method:'POST', body:JSON.stringify({ emailTo, subject, message }) }),
};
