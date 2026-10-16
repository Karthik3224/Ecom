import { serviceBaseUrl } from './apiConfig.js';
import { apiRequest } from './apiClient';
const base = serviceBaseUrl(import.meta.env, 'VITE_ORG_ACCESS_URL', '/org-access');
const post = async (path, body) => {
  try { return await apiRequest(base, `/api/auth/customer/${path}`, { method: 'POST', auth: false, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) }); }
  catch (error) { if (error.name === 'TimeoutError') throw new Error('The server is taking too long. Please retry. If a code arrived, request a new code before verifying.', { cause: error }); throw error; }
};
export const customerAuthService = {
  options: () => apiRequest(base, '/api/auth/customer/options', { auth: false }),
  login: (email, password) => post('login', { email, password }),
  register: (input) => post('register', input),
  send: (destination, purpose) => post('otp/send', { destination, purpose }),
  verify: (challengeId, code) => post('otp/verify', { challengeId, code }),
  reset: (input) => post('password/reset', input),
  logout: () => apiRequest(base, '/api/auth/logout', { method: 'POST', auth: false, headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` } }),
  me: () => apiRequest(base, '/api/customers/me'),
  updateName: (name) => apiRequest(base, '/api/customers/me/name', { method: 'PUT', body: JSON.stringify({ name }) }),
};
