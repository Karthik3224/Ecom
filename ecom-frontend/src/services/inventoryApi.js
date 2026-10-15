import { apiRequest } from './apiClient';

import { inventoryBaseUrl } from './inventoryConfig.js';

const INVENTORY_BASE_URL = inventoryBaseUrl(import.meta.env);
const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  ['productId', 'variantId', 'storeId', 'status', 'page', 'size', 'sort'].forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};
const request = (path, options = {}) => apiRequest(INVENTORY_BASE_URL, path, options);
export const createInventory = async data => request('/api/v1/inventories', { method: 'POST', body: JSON.stringify(data) });
export const updateInventory = async (id, data) => request(`/api/v1/inventories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
export const getInventory = async id => request(`/api/v1/inventories/${encodeURIComponent(id)}`);
export const getInventories = async (params = {}) => {
  const { productId, variantId, storeId, status = 'ACTIVE' } = params;
  return request(`/api/v1/inventories${buildQueryString({ productId, variantId, storeId, status })}`);
};
export const getInventoryForItem = ({ storeId, productId, variantId }) => request(`/api/v1/inventories${buildQueryString({ storeId, productId, variantId })}`);
export const findInventoryForItem = async ({ storeId, productId, variantId }) => {
  const attempts = [];
  if (variantId) attempts.push({ storeId, productId, variantId });
  attempts.push({ storeId, productId });
  for (const query of attempts) {
    try {
      return await getInventoryForItem(query);
    } catch (error) {
      if (Number(error.status) !== 404) throw error;
    }
  }
  const payload = await getInventories({ storeId, status: 'ACTIVE' });
  const rows = Array.isArray(payload) ? payload : payload?.content || payload?.items || payload?.data || payload?.inventories || [];
  const exact = rows.find((item) => item.productId === productId && (variantId ? item.variantId === variantId : true));
  const productLevel = rows.find((item) => item.productId === productId && !item.variantId);
  const anyActiveProductRow = rows.find((item) => item.productId === productId);
  const match = exact || productLevel || anyActiveProductRow;
  if (!match) {
    const error = new Error('Inventory not found for product and store');
    error.status = 404;
    throw error;
  }
  return match;
};
const stockOperation = (id, operation, data) => request(`/api/v1/inventories/${encodeURIComponent(id)}/stock/${operation}`, { method: 'POST', body: JSON.stringify(data) });
export const increaseStock = async (id, data) => stockOperation(id, 'increase', data);
export const decreaseStock = async (id, data) => stockOperation(id, 'decrease', data);
export const reserveStock = async (id, data) => stockOperation(id, 'reserve', data);
export const releaseStock = async (id, data) => stockOperation(id, 'release', data);
export const getStockMovements = async (id, params = {}) => {
  const { page, size, sort } = params;
  return request(`/api/v1/inventories/${encodeURIComponent(id)}/movements${buildQueryString({ page, size, sort })}`);
};
