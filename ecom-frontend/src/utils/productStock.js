// A failed or malformed lookup is unknown stock, never evidence of zero stock.
export const loadProductStock = async (lookup, identity) => {
  try {
    const value = await lookup(identity);
    const matches = value?.storeId === identity.storeId && value?.productId === identity.productId
      && (!identity.variantId || value?.variantId === identity.variantId);
    if (!matches || !Number.isInteger(value.availableQuantity) || value.availableQuantity < 0
      || !['ACTIVE', 'OUT_OF_STOCK', 'INACTIVE'].includes(value.status)) {
      return { state: 'error' };
    }
    return {
      state: value.status === 'ACTIVE' && value.availableQuantity > 0 ? 'available' : 'out',
      available: value.availableQuantity,
    };
  } catch (error) {
    return { state: Number(error.status) === 404 ? 'missing' : 'error' };
  }
};
