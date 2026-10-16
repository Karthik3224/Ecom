import { serviceBaseUrl } from './apiConfig.js';

export const inventoryBaseUrl = (env = {}) => serviceBaseUrl(env, 'VITE_INVENTORY_URL', '/inventory-service');
