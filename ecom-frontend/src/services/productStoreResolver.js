const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const productKey = (product = {}) => product.productId || product.id || product.product_id || '';
const productStoreKey = (key, storeId) => `${storeId || 'store'}:${key}`;
const stores = () => read('local:stores', []);
const byStoreRef = (value) => stores().find((store) => store.id === value || store.name === value);
const explicitStore = (product) => product.storeId
  ? byStoreRef(product.storeId) || { id:product.storeId, name:product.store || product.storeName || product.sourceStore || product.storeId, location:product.location, state:product.state }
  : byStoreRef(product.store) || byStoreRef(product.storeName) || byStoreRef(product.sourceStore);

export const rememberProductStore = (product = {}) => {
  const key = productKey(product);
  const store = explicitStore(product);
  if (!key || !store?.id) return null;
  const index = read('productStoreIndex', {});
  const record = { storeId: store.id, store: store.name, storeName: store.name, location: store.location, state: store.state };
  write('productStoreIndex', { ...index, [productStoreKey(key, store.id)]: record, ...(index[key] ? {} : { [key]: record }) });
  return record;
};

export const resolveProductStore = (product = {}, catalogProducts = []) => {
  const key = productKey(product);
  const direct = explicitStore(product);
  if (direct) return { storeId: direct.id, store: direct.name, storeName: direct.name, location: direct.location, state: direct.state };

  const indexedByStore = key && product.storeId ? read('productStoreIndex', {})[productStoreKey(key, product.storeId)] : null;
  if (indexedByStore) return indexedByStore;

  const catalogMatch = catalogProducts.find((item) => productKey(item) === key || item.title === product.title || item.name === product.productName);
  const catalogStore = catalogMatch ? byStoreRef(catalogMatch.storeId) || byStoreRef(catalogMatch.store) || byStoreRef(catalogMatch.storeName) : null;
  if (catalogStore) return { storeId: catalogStore.id, store: catalogStore.name, storeName: catalogStore.name, location: catalogStore.location, state: catalogStore.state };

  const localMatch = read('local:products', []).find((item) => productKey(item) === key || item.title === product.title || item.name === product.productName);
  const localStore = localMatch ? byStoreRef(localMatch.storeId) || byStoreRef(localMatch.store) || byStoreRef(localMatch.storeName) : null;
  if (localStore) return { storeId: localStore.id, store: localStore.name, storeName: localStore.name, location: localStore.location, state: localStore.state };

  const indexed = key ? read('productStoreIndex', {})[key] : null;
  const indexedStore = indexed ? byStoreRef(indexed.storeId) || byStoreRef(indexed.store) : null;
  if (indexedStore) return { ...indexed, storeId: indexedStore.id, store: indexedStore.name, storeName: indexedStore.name, location: indexedStore.location, state: indexedStore.state };

  return null;
};
