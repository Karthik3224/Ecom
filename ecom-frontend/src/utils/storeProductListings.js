export const uniqueCatalogProducts = (items) => {
  const seen = new Set();
  return items.filter(item => {
    const key = JSON.stringify([item.productId || item.id || item.title, item.variantId || item.selectedVariant?.id || '']);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const uniqueStoreProductListings = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify([item.storeId || item.store || item.storeName || '', item.productId || item.id || item.title]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const balancedStoreProductPreview = (items, limit = 6) => {
  const groups = new Map();
  for (const item of uniqueStoreProductListings(items)) {
    const key = item.fulfillmentType === 'global' ? 'global' : item.storeId || item.store || 'local';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const result = [];
  const queues = [...groups.values()];
  while (result.length < limit && queues.some((queue) => queue.length)) {
    for (const queue of queues) {
      if (queue.length && result.length < limit) result.push(queue.shift());
    }
  }
  return result;
};
