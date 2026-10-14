const fulfillmentStatusLabels = {
  PENDING: 'Pending',
  ALLOCATED: 'Confirmed',
  PACKING: 'Preparing',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

const shipmentStatusLabels = {
  CREATED: 'Shipment Created',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
};

const fulfillmentTypeLabels = {
  SHIP_TO_HOME: 'Ship to Home',
  STORE_PICKUP: 'Store Pickup',
  DIGITAL: 'Digital',
};

const checkoutMethodLabels = {
  pickup: 'Store Pickup',
  standard: 'Ship to Home',
  express: 'Ship to Home',
  instant: 'Ship to Home',
  scheduled: 'Ship to Home',
  digital: 'Digital',
};

const enumToLabel = (value) => String(value || '').split('_').filter(Boolean).map((word) => word[0] + word.slice(1).toLowerCase()).join(' ');

export const fulfillmentStatusLabel = (status) => fulfillmentStatusLabels[status] || enumToLabel(status) || 'Pending';
export const shipmentStatusLabel = (status) => shipmentStatusLabels[status] || enumToLabel(status) || 'Shipment Pending';
export const fulfillmentTypeLabel = (type, checkoutMethod = '') =>
  fulfillmentTypeLabels[type] || checkoutMethodLabels[String(checkoutMethod || '').toLowerCase()] || enumToLabel(type) || 'Fulfillment Pending';

export const customerDeliveryStatus = ({ fulfillment, shipment, order, trackingEvents = [] } = {}) => {
  if (['DELIVERED', 'CANCELLED'].includes(order?.status)) return enumToLabel(order.status);
  if (['CREATED', 'IN_TRANSIT'].includes(shipment?.status) && trackingEvents.at(-1)?.description === 'Assignment accepted by delivery partner.') return 'Delivery partner accepted';
  if (shipment?.status) return shipmentStatusLabel(shipment.status);
  if (fulfillment?.status) return fulfillmentStatusLabel(fulfillment.status);
  if (order?.status) return enumToLabel(order.status);
  return 'Pending';
};
