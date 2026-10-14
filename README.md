# Ecom

Customer ecommerce application with persistent catalog, inventory, cart, checkout, payment, order, fulfillment, delivery tracking, and review services.

## Ubuntu

Install Java 21, Maven, Node.js 20+, npm, and MySQL 8. Create the configured databases and export the required secrets:

```bash
export MYSQL_PASSWORD='your-mysql-password'
export JWT_SECRET='at-least-32-character-production-secret'
export ORDER_SYNC_KEY='at-least-32-character-order-key'
export PAYMENT_SYNC_KEY='at-least-32-character-payment-key'
export FULFILLMENT_SYNC_KEY='at-least-32-character-fulfillment-key'
chmod +x run-all-services.sh
./run-all-services.sh
cd ecom-frontend
npm ci
npm run dev -- --host 0.0.0.0
```

The frontend uses the API gateway on port `8082` through its Vite proxy. Do not use demo or local-storage data in production.

## Windows

Use `RUN-APPLICATION.bat` or `START-APPLICATION.ps1`.
