export { totalDeliveryCharge } from '../utils/deliveryCharges.js';
import { getCachedStoreDeliveryQuote, getStoreDeliveryQuote, getStores } from './catalogApi';
import { resolveProductStore } from './productStoreResolver';
import { pickupDeliveryLine, storeFulfillmentMethod } from '../utils/storeFulfillment.js';
import { deliveryMethodId, deliverySlotLabel, isGlobalProduct, isGlobalStore, parseDeliveryModes, preferredDeliveryMethod, sortDeliveryMethods } from '../utils/storeDelivery';

const lineKey = (item = {}) => `${item.storeId || item.sourceStoreId || item.store || item.storeName || 'store'}:${item.productId || item.id || ''}:${item.variantId ?? 'product'}`;

const itemTotal = (item = {}) => Number(item.price || item.unitPrice || 0) * Number(item.quantity || 0);

const matchesProduct = (left = {}, right = {}) => {
  const leftId = String(left.productId ?? left.id ?? '');
  const rightId = String(right.productId ?? right.id ?? '');
  return Boolean((leftId && rightId && leftId === rightId) || (left.title && right.title && left.title === right.title) || (left.productName && right.title && left.productName === right.title));
};

const globalLine = (item, source = {}, quote = null) => ({
  key: lineKey(item),
  productId: item.productId || item.id || '',
  variantId: item.variantId ?? null,
  title: item.title || item.productName || item.name || 'Product',
  quantity: Number(item.quantity || 0),
  itemTotal: itemTotal(item),
  storeId: source.storeId || item.storeId || 'global-store',
  storeName: source.store || source.storeName || item.store || item.storeName || 'India-wide Global Store',
  sourceLocation: source.location || '',
  deliveryType: 'global',
  deliveryLabel: 'Global Delivery',
  estimatedDelivery: '5-7 days delivery',
  deliveryCharge: 0,
  fulfillmentType: 'global',
  globalApproval: 'Pending',
  quote,
});

const localLine = (item, source, quote, method) => {
  const selected = sortDeliveryMethods(quote?.methods || []).find((entry) => entry.deliveryType === method) || {};
  const charge = Number(quote?.deliveryCharge ?? selected.deliveryCharge ?? 0);
  const eta = selected.estimatedTime || (quote?.estimatedDeliveryMin && quote?.estimatedDeliveryMax ? `${quote.estimatedDeliveryMin}-${quote.estimatedDeliveryMax} min` : '');
  return {
    key: lineKey(item),
    productId: item.productId || item.id || '',
    variantId: item.variantId ?? null,
    title: item.title || item.productName || item.name || 'Product',
    quantity: Number(item.quantity || 0),
    itemTotal: itemTotal(item),
    storeId: source.storeId || quote?.storeId || '',
    storeName: source.store || source.storeName || '',
    sourceLocation: source.location || '',
    deliveryType: deliveryMethodId(method),
    deliveryLabel: deliverySlotLabel(method),
    estimatedDelivery: eta || 'Tomorrow',
    deliveryCharge: charge,
    fulfillmentType: 'nearby',
    globalApproval: 'Not Required',
    quote,
  };
};

const storeFallbackQuote = (store = {}) => {
  const eta = Number(store.deliveryEtaMinutes || 0);
  const methods = parseDeliveryModes(store.deliveryModes).map((deliveryType) => ({
    deliveryType,
    enabled:true,
    deliveryCharge:Number(store.deliveryCharge || 0),
    estimatedTime:eta > 0 ? `${eta} min` : '',
  }));
  return {
    storeId:store.id,
    deliveryAvailable:true,
    deliveryCharge:Number(store.deliveryCharge || 0),
    estimatedDeliveryMin:eta || null,
    estimatedDeliveryMax:eta || null,
    methods,
  };
};

export const buildCartDeliveryLines = async ({ cartItems = [], catalogProducts = [], latitude, longitude, defaultMethod = 'standard', cached = true, selectedStoreId = '', storeMethods = {} }) => {
  const response = await getStores();
  const stores = Array.isArray(response) ? response : response?.content || response?.items || [];
  if (!stores.length) throw new Error('Store details are unavailable. Please retry.');
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return cartItems.map((item) => {
      const source = resolveProductStore(item, catalogProducts) || {};
      const store = stores.find((entry) => source.storeId ? entry.id === source.storeId : entry.name === source.store || entry.name === source.storeName);
      if (store && !isGlobalStore(store)) {
        const storeSource = { ...source, storeId:store.id, store:store.name, storeName:store.name, location:store.location };
        if (storeFulfillmentMethod(store, storeMethods, defaultMethod) === 'pickup') return pickupDeliveryLine(localLine(item, storeSource, null, 'pickup'));
        const quote = storeFallbackQuote(store);
        return localLine(item, storeSource, quote, preferredDeliveryMethod(quote) || defaultMethod);
      }
      return globalLine(item, source);
    });
  }
  const selectedStore = stores.find((entry) => entry.id === selectedStoreId);
  return Promise.all(cartItems.map(async (item) => {
    const source = resolveProductStore(item, catalogProducts) || {};
    const store = stores.find((entry) => source.storeId ? entry.id === source.storeId : entry.name === source.store || entry.name === source.storeName) || (!source.storeId ? selectedStore : null);
    const storeSource = store ? { ...source, storeId: store.id, store: store.name, storeName: store.name, location: store.location } : source;
    const catalogProduct = catalogProducts.find((product) => matchesProduct(item, product));
    if (isGlobalStore(store)) return globalLine(item, storeSource);
    if (!store && (isGlobalProduct(item) || isGlobalProduct(catalogProduct))) return globalLine(item, storeSource);
    if (!storeSource.storeId || !store) return globalLine(item, storeSource);
    const requestedStoreMethod = storeFulfillmentMethod(store, storeMethods, defaultMethod);
    if (requestedStoreMethod === 'pickup') return pickupDeliveryLine(localLine(item, storeSource, null, 'pickup'));
    try {
      const quote = await (cached ? getCachedStoreDeliveryQuote : getStoreDeliveryQuote)(storeSource.storeId, {
        latitude,
        longitude,
        orderTotal: cartItems.filter((entry) => {
          const entrySource = resolveProductStore(entry, catalogProducts) || {};
          return (entrySource.storeId || entry.storeId) === storeSource.storeId;
        }).reduce((sum, entry) => sum + itemTotal(entry), 0),
        deliveryMethod: requestedStoreMethod,
      });
      if (quote?.deliveryAvailable === false && !quote?.deliveryZoneId) return localLine(item, storeSource, quote, quote?.selectedDeliveryMethod || defaultMethod);
      const requestedMethod = deliveryMethodId(requestedStoreMethod);
      const quotedMethods = (quote?.methods || []).map((entry) => deliveryMethodId(entry.deliveryType));
      const method = requestedMethod === 'scheduled' || quotedMethods.includes(requestedMethod)
        ? requestedStoreMethod
        : preferredDeliveryMethod(quote) || preferredDeliveryMethod({ ...quote, deliveryAvailable: true }) || quote?.selectedDeliveryMethod || requestedStoreMethod;
      return localLine(item, storeSource, quote, method);
    } catch {
      return { ...localLine(item, storeSource, null, defaultMethod), quoteUnavailable: true, estimatedDelivery: 'Delivery check unavailable' };
    }
  }));
};

export const hasGlobalDelivery = (lines = []) => lines.some((line) => line.fulfillmentType === 'global');
