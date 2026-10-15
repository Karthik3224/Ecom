import { requestId } from '../utils/requestId.js';
import { apiRequest } from './apiClient';

const CART_BASE_URL = (import.meta.env.VITE_CART_URL || '/cart-api').replace(/\/$/, '');

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  ['customerId', 'storeId'].forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const request = (path, options = {}) => apiRequest(CART_BASE_URL, path, options);

export const createCart = async (data) => request('/api/v1/carts', { method: 'POST', body: JSON.stringify(data) });

export const getCart = async (cartId) => request(`/api/v1/carts/${encodeURIComponent(cartId)}`);

export const getActiveCart = async ({ customerId, storeId }) => request(`/api/v1/carts/active${buildQueryString({ customerId, storeId })}`);

export const addCartItem = async (cartId, data, key = requestId()) => request(`/api/v1/carts/${encodeURIComponent(cartId)}/items`, { method: 'POST', body: JSON.stringify(data), headers: { 'Idempotency-Key': key } });

export const updateCartItem = async (cartId, itemId, data) => request(`/api/v1/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: JSON.stringify(data) });

export const removeCartItem = async (cartId, itemId) => request(`/api/v1/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });

export const clearCartItems = async (cartId) => request(`/api/v1/carts/${encodeURIComponent(cartId)}/items`, { method: 'DELETE' });

export const calculateCartTotal = async (cartId) => request(`/api/v1/carts/${encodeURIComponent(cartId)}/calculate-total`, { method: 'POST' });
