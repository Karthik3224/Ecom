import { serviceBaseUrl } from './apiConfig.js';

export const catalogBaseUrl = (env = {}) => serviceBaseUrl(env, 'VITE_CATALOG_URL', '/catalog-service');
