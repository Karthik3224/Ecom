export const storeFulfillmentMethod = (store, methods, fallback = 'standard') =>
  store?.id === 'global-store' || store?.global === true ? 'global' : methods[store?.id] || fallback;

export const pickupDeliveryLine = (line) => ({
  ...line,
  deliveryType: 'pickup',
  selectedDeliveryMethod: 'pickup',
  deliveryLabel: 'Store Pickup',
  estimatedDelivery: '',
  deliveryCharge: 0,
  quoteUnavailable: false,
});
