import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const portOffset = process.env.ECOM_ISOLATED_TEST === 'true' ? 10000 : 0;
const qualificationBase = process.env.ECOM_ISOLATED_TEST === 'true' ? Number(process.env.ECOM_CHECKOUT_QUALIFICATION_PORT_BASE || 0) : 0;
if (qualificationBase && (!Number.isInteger(qualificationBase) || qualificationBase < 20000 || qualificationBase > 60000)) {
  throw new Error('Invalid isolated checkout qualification port base');
}
const qualificationPorts = { 8089: 0, 8091: 1, 8095: 2, 3314: 3, 3315: 4, 3317: 5, 3311: 6 };
const service = (port) => `http://127.0.0.1:${qualificationBase && port in qualificationPorts ? qualificationBase + qualificationPorts[port] : port + portOffset}`;

// Google Maps browser key is loaded from .env as VITE_GOOGLE_MAPS_API_KEY.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_PERSISTED_ORDER_DEMO': JSON.stringify(process.env.ECOM_ISOLATED_TEST === 'true'),
  },
  server: {
    proxy: {
      '/payments': {
        target: service(3314),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/payments/, ''),
      },
      '/org-access': {
        target: service(3310),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/org-access/, ''),
      },
      '/customer-profile': {
        target: service(8088),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/customer-profile/, ''),
      },
      '/catalog': {
        target: service(8089),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/catalog/, ''),
      },
      '/inventory': {
        target: service(8095),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/inventory/, ''),
      },
      '/cart-api': {
        target: service(8091),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cart-api/, ''),
      },
      '/order-api': {
        target: service(3311),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/order-api/, ''),
      },
      '/fulfillment': {
        target: service(3315),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fulfillment/, ''),
      },
      '/notification-service': {
        target: service(3317),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/notification-service/, ''),
      },
      '/alerts': {
        target: process.env.ECOM_ISOLATED_TEST === 'true' ? 'http://127.0.0.1:1' : service(8087),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/alerts/, ''),
      },
    },
  },
})
