// Resolve backend services against the configured common gateway.
export const serviceBaseUrl = (env = {}, overrideKey, servicePath) => {
  const gateway = (env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  return (env[overrideKey] || gateway + servicePath).replace(/\/+$/, '');
};
