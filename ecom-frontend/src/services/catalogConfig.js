// Keep explicit service overrides and the local development proxy supported.
export const catalogBaseUrl = (env = {}) => {
  const gateway = (env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  return (env.VITE_CATALOG_URL || (gateway ? `${gateway}/catalog-service` : '/catalog')).replace(/\/+$/, '');
};
