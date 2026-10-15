import { apiRequest } from './apiClient';
import { catalogBaseUrl } from './catalogConfig.js';
const CATALOG_BASE_URL = catalogBaseUrl(import.meta.env);

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const pendingReads = new Map();
const request = (path, options = {}) => {
  if (options.method && options.method !== 'GET') return apiRequest(CATALOG_BASE_URL, path, options);
  const publicReadOptions = { ...options, auth: options.auth ?? false };
  const key = path;
  if (!pendingReads.has(key)) {
    pendingReads.set(key, apiRequest(CATALOG_BASE_URL, path, publicReadOptions).finally(() => pendingReads.delete(key)));
  }
  return pendingReads.get(key);
};
const quoteCache = new Map();
const QUOTE_CACHE_TTL_MS = 5 * 60 * 1000;
const QUOTE_FAILURE_TTL_MS = 30 * 1000;
const quoteCacheKey = (storeId, params = {}) => [
  storeId,
  Number(params.latitude).toFixed(5),
  Number(params.longitude).toFixed(5),
  params.orderTotal ?? '',
  params.deliveryMethod ?? '',
].join('|');

export const getCategories = async () => request('/api/v1/categories');
export const getCategory = async (categoryId) => request(`/api/v1/categories/${encodeURIComponent(categoryId)}`);
export const createCategory = async (data) => request('/api/v1/categories', { method:'POST', body:JSON.stringify(data) });
export const updateCategory = async (id, data) => request(`/api/v1/categories/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteCategory = async (id) => request(`/api/v1/categories/${encodeURIComponent(id)}`, { method:'DELETE' });
export const getCategoryProducts = async (categoryId, params = {}) => {
  if (!categoryId) return getProducts(params);
  return request(`/api/v1/categories/${encodeURIComponent(categoryId)}/products${buildQueryString(params)}`);
};

export const getBanners = async (params = {}) => request(`/api/v1/banners${buildQueryString(params)}`);
export const createBanner = async (data) => request('/api/v1/banners', { method:'POST', body:JSON.stringify(data) });
export const updateBanner = async (id, data) => request(`/api/v1/banners/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteBanner = async (id) => request(`/api/v1/banners/${encodeURIComponent(id)}`, { method:'DELETE' });
export const setBannerStatus = async (id, status) => request(`/api/v1/banners/${encodeURIComponent(id)}/status`, { method:'PATCH', body:JSON.stringify({ status }) });

export const getProducts = async (params = {}) => request(`/api/v1/products${buildQueryString(params)}`);
export const searchProducts = async (params = {}) => getProducts(params);
export const getProduct = async (productId) => request(`/api/v1/products/${encodeURIComponent(productId)}`);
export const createProduct = async (data) => request('/api/v1/products', { method:'POST', body:JSON.stringify(data) });
export const updateProduct = async (id, data) => request(`/api/v1/products/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteProduct = async (id) => request(`/api/v1/products/${encodeURIComponent(id)}`, { method:'DELETE' });
export const getStores = async (params = {}) => request(`/api/v1/stores${buildQueryString(params)}`);
export const getStore = async (storeId) => request(`/api/v1/stores/${encodeURIComponent(storeId)}`);
export const createStore = async (data) => request('/api/v1/stores', { method:'POST', body:JSON.stringify(data) });
export const updateStore = async (id, data) => request(`/api/v1/stores/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteStore = async (id) => request(`/api/v1/stores/${encodeURIComponent(id)}`, { method:'DELETE' });
export const getStoreDeliveryZones = async (storeId) => request(`/api/v1/stores/${encodeURIComponent(storeId)}/delivery-zones`);
export const createStoreDeliveryZone = async (storeId, data) => request(`/api/v1/stores/${encodeURIComponent(storeId)}/delivery-zones`, { method:'POST', body:JSON.stringify(data) });
export const updateStoreDeliveryZone = async (storeId, zoneId, data) => request(`/api/v1/stores/${encodeURIComponent(storeId)}/delivery-zones/${encodeURIComponent(zoneId)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteStoreDeliveryZone = async (storeId, zoneId) => request(`/api/v1/stores/${encodeURIComponent(storeId)}/delivery-zones/${encodeURIComponent(zoneId)}`, { method:'DELETE' });
export const getStoreDeliveryQuote = async (storeId, params = {}) => request(`/api/v1/stores/${encodeURIComponent(storeId)}/delivery-quote${buildQueryString(params)}`);
export const getCachedStoreDeliveryQuote = async (storeId, params = {}) => {
  const key = quoteCacheKey(storeId, params);
  const cached = quoteCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  if (cached) quoteCache.delete(key);
  const entry = { promise: null, expiresAt: Date.now() + QUOTE_CACHE_TTL_MS };
  entry.promise = getStoreDeliveryQuote(storeId, params).catch((error) => {
    entry.expiresAt = Date.now() + QUOTE_FAILURE_TTL_MS;
    throw error;
  });
  quoteCache.set(key, entry);
  return entry.promise;
};
export const clearDeliveryQuoteCache = () => quoteCache.clear();
export const getProductVariants = async (productId) => request(`/api/v1/products/${encodeURIComponent(productId)}/variants`);
export const getVariant = async (variantId) => request(`/api/v1/variants/${encodeURIComponent(variantId)}`);
export const createVariant = async (productId, data) => request(`/api/v1/products/${encodeURIComponent(productId)}/variants`, { method:'POST', body:JSON.stringify(data) });
export const updateVariant = async (id, data) => request(`/api/v1/variants/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteVariant = async (id) => request(`/api/v1/variants/${encodeURIComponent(id)}`, { method:'DELETE' });
export const getProductImages = async (productId) => request(`/api/v1/products/${encodeURIComponent(productId)}/images`);
export const getImage = async (imageId) => request(`/api/v1/images/${encodeURIComponent(imageId)}`);
export const createImage = async (productId, data) => request(`/api/v1/products/${encodeURIComponent(productId)}/images`, { method:'POST', body:JSON.stringify(data) });
export const updateImage = async (id, data) => request(`/api/v1/images/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteImage = async (id) => request(`/api/v1/images/${encodeURIComponent(id)}`, { method:'DELETE' });
export const getStoreProducts = async (storeId, params = {}) => {
  const query = new URLSearchParams();
  if (storeId) query.set('storeId', String(storeId));
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  return request(`/api/v1/store-products${query.toString() ? `?${query.toString()}` : ''}`);
};
export const createStoreProduct = async (data) => request('/api/v1/store-products', { method:'POST', body:JSON.stringify(data) });
export const updateStoreProduct = async (id, data) => request(`/api/v1/store-products/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) });
export const deleteStoreProduct = async (id) => request(`/api/v1/store-products/${encodeURIComponent(id)}`, { method:'DELETE' });
