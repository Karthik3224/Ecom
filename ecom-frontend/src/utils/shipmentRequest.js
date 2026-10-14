export const shipmentRequest = (order, fulfillment) => {
  let estimatedDeliveryDate = order.scheduledDeliveryDate;
  if (!estimatedDeliveryDate) {
    const created = Date.parse(order.createdAt);
    const minutes = Number(order.estimatedDeliveryMax);
    if (!Number.isFinite(created) || !Number.isInteger(minutes) || minutes <= 0) {
      throw new Error('Record a delivery estimate before creating the shipment.');
    }
    estimatedDeliveryDate = new Date(created + minutes * 60000).toISOString().slice(0, 10);
  }
  return { fulfillmentId: fulfillment.id, carrier: 'Store Delivery', estimatedDeliveryDate };
};
