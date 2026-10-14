export const totalDeliveryCharge = (lines = []) => {
  const charges = new Map();
  for (const line of lines) {
    if (line.fulfillmentType === 'global') continue;
    const key = `${line.storeId || line.storeName}:${line.deliveryType || 'delivery'}`;
    const charge = Number(line.deliveryCharge || 0);
    if (!Number.isFinite(charge) || charge < 0) throw new Error('Invalid delivery charge.');
    charges.set(key, Math.max(charges.get(key) || 0, charge));
  }
  return [...charges.values()].reduce((total, charge) => total + charge, 0);
};
