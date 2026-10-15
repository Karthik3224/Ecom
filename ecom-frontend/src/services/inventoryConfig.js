export const inventoryBaseUrl = (env = {}) => {
  const gateway = (env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  return (env.VITE_INVENTORY_URL || (gateway ? `${gateway}/inventory-service` : '/inventory')).replace(/\/+$/, '');
};
