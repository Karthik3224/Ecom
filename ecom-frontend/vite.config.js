
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';



export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const BACKEND_URL = (env.VITE_API_BASE_URL || 'http://localhost:8082').replace(/\/+$/, '');
  return {
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,

    proxy: {
      '/alerts-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/org-access': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/customer-profile': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/catalog-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/notification-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/order-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/order-api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/cart-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/cart-api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/inventory-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/fulfillment-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      // Frontend fulfillment API:
      // /fulfillment/api/v1/fulfillments
      // becomes /fulfillment-service/api/v1/fulfillments
      '/fulfillment': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/fulfillment/, '/fulfillment-service'),
      },

      '/payment-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/customer-profile-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },

      '/org-access-service': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
    },
  },
  };
});
