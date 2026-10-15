import { translate, normalizeLanguage, languageCode } from '../i18n/index';
import { readLanguage, persistLanguage } from '../i18n/preferences';
import { customerAuthService } from '../services/customerAuthService';
import { createContext, useState, useEffect, useRef } from 'react';
import { readSelectedLocation, storeSelectedLocation } from '../utils/selectedLocation';
import { customerProfileService } from '../services/customerProfileService';
import { getCustomerOrders, normalizeOrder, orderDeliveryAddress } from '../services/orderApi';
import { collectionStore } from '../services/localDataService';
import { getProducts, getCategories, getCategoryProducts, getStoreProducts, getStores, getBanners } from '../services/catalogApi';
import { adaptProductList, adaptCategoryList, adaptStoreProductList, adaptBannerList } from '../services/catalogAdapter';
import { addCartItem, calculateCartTotal, clearCartItems, createCart, getActiveCart, removeCartItem, updateCartItem } from '../services/cartApi';
import { rememberProductStore, resolveProductStore } from '../services/productStoreResolver';
import { cleanDisplayText } from '../utils/textEncoding';
import { findInventoryForItem } from '../services/inventoryApi';
import { validateCheckoutAvailability } from '../utils/checkoutAvailability';

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

const GUEST_CART_KEY = 'guestCartItems';
const GUEST_CART_ID = 'guest-local-cart';
const cleanLocationText = (value) => String(value || '')
  .split(',')
  .map((part) => part.trim())
  .filter((part) => part && !/^undefined$/i.test(part) && !/^null$/i.test(part))
  .join(', ')
  .replace(/\s+/g, ' ')
  .trim();

const readStoredArray = (key) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
};

const readStoredObject = (storage, key) => {
  try {
    const saved = storage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    storage.removeItem(key);
    return null;
  }
};

const tokenCustomerId = () => {
  try {
    const token = sessionStorage.getItem('authToken') || '';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.customerId || null;
  } catch { return null; }
};

export const AppProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = sessionStorage.getItem('isLoggedIn');
    try {
      const token = sessionStorage.getItem('authToken');
      const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return saved === 'true' && claims.exp * 1000 > Date.now();
    } catch { return false; }
  });

  const readGuestCartItems = () => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [cartItems, setCartItems] = useState(() => readGuestCartItems());
  const [activeCart, setActiveCart] = useState(() => {
    const items = readGuestCartItems();
    return items.length ? { id: GUEST_CART_ID, status: 'GUEST', totalAmount: items.reduce((sum, item) => sum + Number(item.price || item.unitPrice || 0) * Number(item.quantity || 0), 0) } : null;
  });
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const [cartUnavailable, setCartUnavailable] = useState(false);

  const [user, setUser] = useState(() => {
    const stored = readStoredObject(sessionStorage, 'user');
    const customerId = tokenCustomerId();
    return stored && customerId ? { ...stored, id: customerId } : stored;
  });
  const [wishlistItems, setWishlistItems] = useState(() => {
    const key = user?.id && isLoggedIn ? 'wishlist:' + user.id : 'wishlistItems';
    return readStoredArray(key);
  });
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('addresses');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedForLater, setSavedForLater] = useState(() => {
    const saved = localStorage.getItem('savedForLater');
    return saved ? JSON.parse(saved) : [];
  });
  // Delivery addresses derived from this customer's previous orders (not persisted, refreshed on login).
  const [orderAddresses, setOrderAddresses] = useState([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogStoreProducts, setCatalogStoreProducts] = useState([]);
  const [catalogStores, setCatalogStores] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogBanners, setCatalogBanners] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(() => readSelectedLocation());
  const [userCity, setUserCity] = useState(() => readSelectedLocation()?.city || '');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    const savedLocation = readSelectedLocation();
    if (savedLocation) return cleanLocationText(savedLocation.address || [savedLocation.title, savedLocation.city].filter(Boolean).join(', '));
    try {
      const saved = localStorage.getItem('addresses');
      const parsed = saved ? JSON.parse(saved) : [];
      return (parsed.find((item) => item.isDefault || item.defaultAddress) || parsed[0])?.address || '';
    } catch {
      return '';
    }
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [deliveryMode, setDeliveryModeState] = useState(() => localStorage.getItem('deliveryMode') || 'delivery');
  const setDeliveryMode = (mode) => {
    const next = mode === 'pickup' ? 'pickup' : 'delivery';
    localStorage.setItem('deliveryMode', next);
    setDeliveryModeState(next);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const localCartTotal = (items = cartItems) => items.reduce((sum, item) => sum + Number(item.price || item.unitPrice || 0) * Number(item.quantity || 0), 0);
  const cartTotal = Number(activeCart?.totalAmount ?? localCartTotal());
  const currentCustomerId = () => tokenCustomerId() || user?.id || null;

  const resolveProductIdentity = (product) => {
    const variant = product?.variant || product?.selectedVariant || product?.variants?.[0] || {};
    return {
      productId: product?.productId || product?.id || variant?.productId || null,
      variantId: product?.variantId ?? variant?.variantId ?? variant?.id ?? null,
    };
  };

  const sameCatalogItem = (left, right) =>
    Boolean(left?.productId && right?.productId && left.productId === right.productId && (left.variantId ?? null) === (right.variantId ?? null) && (!left.storeId || !right.storeId || left.storeId === right.storeId));

  const catalogItemKey = (item) => `${item?.storeId || 'store'}:${item?.productId || ''}:${item?.variantId ?? 'product'}`;

  const adaptCartItem = (item, cart = null) => {
    const cartStore = cart?.storeId
      ? {
          storeId: cart.storeId,
          store: cart.storeName || cart.store || item?.store || item?.storeName || cart.storeId,
          storeName: cart.storeName || cart.store || item?.storeName || item?.store || cart.storeId,
        }
      : {};
    const source = resolveProductStore({ ...cartStore, ...item }, catalogProducts) || {};
    return {
      ...source,
      ...cartStore,
      ...item,
      storeId: item?.storeId || cartStore.storeId || source.storeId,
      store: item?.store || item?.storeName || cartStore.store || source.store,
      storeName: item?.storeName || item?.store || cartStore.storeName || source.storeName,
      id: item?.id || null,
      productId: item?.productId || null,
      variantId: item?.variantId ?? null,
      productName: cleanDisplayText(item?.productName || item?.title || 'Product'),
      quantity: Number(item?.quantity || 0),
      unitPrice: Number(item?.unitPrice ?? item?.price ?? 0),
      totalPrice: Number(item?.totalPrice ?? Number(item?.unitPrice ?? item?.price ?? 0) * Number(item?.quantity || 0)),
      title: cleanDisplayText(item?.productName || item?.title || 'Product'),
      price: Number(item?.unitPrice ?? item?.price ?? 0),
      weight: cleanDisplayText(item?.weight || (item?.variantId == null ? 'Product-level item' : String(item.variantId))),
    };
  };

  const cartItemsFromResponse = (cart) => {
    const items = Array.isArray(cart?.items) ? cart.items : Array.isArray(cart?.cartItems) ? cart.cartItems : [];
    return items.map((item) => adaptCartItem(item, cart));
  };

  const applyCartResponse = (cart) => {
    setActiveCart(cart || null);
    setCartItems(cartItemsFromResponse(cart));
    setCartUnavailable(false);
    setCartError('');
    return cart;
  };

  const mergeCartResponse = (cart) => {
    const incoming = cartItemsFromResponse(cart);
    const storeId = cart?.storeId || incoming.find((item) => item.storeId)?.storeId || '';
    setActiveCart(cart || null);
    setCartItems((current) => [
      ...current.filter((item) => !storeId || item.storeId !== storeId),
      ...incoming,
    ]);
    setCartUnavailable(false);
    setCartError('');
    return cart;
  };

  const applyGuestCartItems = (items) => {
    const normalized = items.map(adaptCartItem).filter((item) => item.productId && item.quantity > 0);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(normalized));
    setCartItems(normalized);
    setActiveCart(normalized.length ? { id: GUEST_CART_ID, status: 'GUEST', totalAmount: localCartTotal(normalized) } : null);
    setCartUnavailable(false);
    setCartError('');
    return normalized;
  };

  const upsertGuestCartItem = (itemPayload) => {
    const items = readGuestCartItems().map(adaptCartItem);
    const existingIndex = items.findIndex((item) => sameCatalogItem(item, itemPayload));
    const nextItems = [...items];
    if (existingIndex >= 0) {
      const current = nextItems[existingIndex];
      const quantity = Number(current.quantity || 0) + 1;
      nextItems[existingIndex] = { ...current, quantity, totalPrice: Number(current.unitPrice || current.price || 0) * quantity };
    } else {
      nextItems.push({ ...itemPayload, quantity: 1, totalPrice: itemPayload.unitPrice });
    }
    return applyGuestCartItems(nextItems);
  };

  const isCartServiceUnavailable = (error) => error?.name === 'TypeError' || Number(error?.status) >= 500;

  const buildCartItem = (product) => {
    if (!product) return null;
    const identity = resolveProductIdentity(product);
    if (!identity.productId) return null;
    const variant = product.variant || product.selectedVariant || product.variants?.find((item) => (item.variantId || item.id) === identity.variantId) || product.variants?.[0] || {};
    const source = rememberProductStore(product) || resolveProductStore(product, catalogProducts) || {};
    return {
      ...source,
      ...product,
      id: identity.productId,
      productId: identity.productId,
      variantId: identity.variantId,
      productName: cleanDisplayText(product.productName || product.title || product.name || 'Product'),
      title: cleanDisplayText(product.title || product.name || 'Product'),
      weight: cleanDisplayText(product.weight || variant.label || variant.weight || variant.name || ''),
      unitPrice: Number(product.unitPrice ?? product.price ?? variant.price ?? 0),
      price: Number(product.unitPrice ?? product.price ?? variant.price ?? 0),
      image: product.image || variant.image || '',
    };
  };

  const resolveCartStoreId = (product) => {
    if (product?.storeId) return product.storeId;
    const selectedStore = localStorage.getItem('selectedStoreId') || localStorage.getItem('selectedStore');
    const stores = collectionStore.list('stores');
    const match = stores.find((store) => store.id === selectedStore || store.name === selectedStore);
    return match?.id || stores.find((store) => store.status !== 'Inactive' && store.active !== false)?.id || null;
  };

  const cartScopeFor = (product) => ({
    customerId: currentCustomerId(),
    storeId: resolveCartStoreId(product),
  });

  const catalogRequest = useRef(null);
  const loadCatalog = () => {
    if (catalogRequest.current) return catalogRequest.current;
    setCatalogLoading(true);
    setCatalogError(null);
    // Render products as soon as they arrive; metadata cannot block the product grid.
    const productsRequest = getProducts({ status: 'ACTIVE' })
      .then((response) => {
        const products = adaptProductList(response || []);
        setCatalogProducts(products);
        return products;
      })
      .catch((error) => {
        setCatalogError(error.status >= 500 ? 'Products are temporarily unavailable. Please retry in a moment.' : error.message || 'Products are unavailable. Please retry.');
        throw error;
      });
    const categoriesRequest = getCategories()
      .then((response) => setCatalogCategories(adaptCategoryList(response || [])))
      .catch((error) => console.warn('Could not refresh categories:', error.message));
    const bannersRequest = getBanners()
      .then((response) => setCatalogBanners(adaptBannerList(response || [])))
      .catch((error) => console.warn('Could not refresh banners:', error.message));
    const storesRequest = getStores()
      .then((response) => {
        setCatalogStores(Array.isArray(response) ? response : response?.content || response?.items || []);
      })
      .catch(() => {
        const localStores = collectionStore.list('stores').filter((store) => store.status !== 'Inactive' && store.active !== false);
        setCatalogStores(localStores);
        if (!localStores.length) setCatalogError('Delivery stores could not be loaded. Please retry in a moment.');
      });
    const storeRequest = getStoreProducts('', { status: 'ACTIVE' });
    const mappingsRequest = Promise.all([productsRequest, storeRequest])
      .then(([products, response]) => {
        const byId = new Map(products.map((product) => [product.productId, product]));
        const storeProducts = adaptStoreProductList(response || [])
          .filter((item) => item.available !== false)
          .map((item) => ({ ...item, product: item.product || byId.get(item.productId) || null }));
        setCatalogStoreProducts(storeProducts);
      })
      .catch(() => {
        const localStores = collectionStore.list('stores').filter((store) => store.status !== 'Inactive' && store.active !== false);
        if (localStores.length) {
          setCatalogStores(localStores);
        } else {
          setCatalogError('Products and delivery availability could not be loaded. Please retry in a moment.');
        }
      });
    catalogRequest.current = Promise.allSettled([productsRequest, categoriesRequest, bannersRequest, mappingsRequest, storesRequest])
      .finally(() => { catalogRequest.current = null; setCatalogLoading(false); });
    return catalogRequest.current;
  };

  const loadCatalogProducts = async (params = {}) => {
    const response = await getProducts(params);
    const products = adaptProductList(response || []);
    setCatalogProducts(products);
    return products;
  };

  const updateCatalogStore = (store) => {
    setCatalogStores((current) => current.some((item) => item.id === store.id)
      ? current.map((item) => item.id === store.id ? store : item)
      : [...current, store]);
  };

  const loadCategoryProducts = async (categoryId, params = {}) => {
    const response = await getCategoryProducts(categoryId, params);
    return adaptProductList(response || []);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCatalog();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('isLoggedIn', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => sessionStorage.setItem('user', JSON.stringify(user)), [user]);
  useEffect(() => {
    if (!isLoggedIn) localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
  }, [wishlistItems, isLoggedIn]);
  useEffect(() => localStorage.setItem('addresses', JSON.stringify(addresses)), [addresses]);
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!isLoggedIn || !token || token.startsWith('local-')) return;
    customerProfileService.addresses().then((items) => {
      const mapped = items.map((item) => ({ ...item, isDefault: item.defaultAddress, coordinates: item.latitude != null && item.longitude != null ? { lat:item.latitude, lng:item.longitude } : null, manualLocation: item.street ? { street:item.street, city:item.city || '', state:item.state || '', pincode:item.pincode || '' } : null }));
      setAddresses(mapped);
    }).catch((error) => console.warn('Could not load addresses:', error.message));
  }, [isLoggedIn]);
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    const customerId = currentCustomerId();
    if (!isLoggedIn || !token || token.startsWith('local-') || !customerId) return;
    getCustomerOrders(customerId, { expireSession: false }).then((orders) => {
      const seen = new Set();
      const derived = (Array.isArray(orders) ? orders : [])
        .map((order) => orderDeliveryAddress(normalizeOrder(order)))
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0))
        .reduce((list, entry) => {
          const key = entry.address.toLowerCase().replace(/\s+/g, ' ');
          if (seen.has(key)) return list;
          seen.add(key);
          list.push({ ...entry, id: `order-address-${list.length}`, type: 'Previous order', fromOrder: true });
          return list;
        }, []);
      setOrderAddresses(derived);
    }).catch((error) => { console.warn('Could not load previous order addresses:', error.message); setOrderAddresses([]); });
  }, [isLoggedIn, user?.id]);
  useEffect(() => localStorage.setItem('savedForLater', JSON.stringify(savedForLater)), [savedForLater]);

  const login = (authenticatedUser, token) => {
    if (token) sessionStorage.setItem('authToken', token);
    const customerId = tokenCustomerId();
    const accountUser = customerId ? { ...authenticatedUser, id: customerId } : authenticatedUser;
    let accountLikes = readStoredArray('wishlist:' + accountUser.id);
    const combinedLikes = [...accountLikes, ...(!isLoggedIn ? wishlistItems : [])];
    const mergedLikes = combinedLikes.filter((item, index, items) => items.findIndex((other) => sameCatalogItem(other, item)) === index);
    localStorage.setItem('wishlist:' + accountUser.id, JSON.stringify(mergedLikes));
    localStorage.removeItem('wishlistItems');
    setWishlistItems(mergedLikes);
    setSavedForLater(readStoredArray('saved:' + authenticatedUser.id));
    setAddresses([]);
    setOrderAddresses([]);
    setUser(accountUser || null);
    if (accountUser?.locale) updateLocale(accountUser.locale);
    setIsLoggedIn(true);
  };
  const logout = () => {
    const token = sessionStorage.getItem('authToken');
    if (token && !token.startsWith('local-')) customerAuthService.logout().catch(() => {});
    sessionStorage.removeItem('user');
    sessionStorage.setItem('isLoggedIn', 'false');
    setWishlistItems([]); setSavedForLater([]); setAddresses([]); setOrderAddresses([]);
    setIsLoggedIn(false);
    setUser(null);
    sessionStorage.removeItem('authToken');
    setCartItems([]);
    setActiveCart(null);
  };

  useEffect(() => {
    const expire = () => logout();
    window.addEventListener('customer-session-expired', expire);
    let timer;
    if (isLoggedIn) {
      try {
        const token = sessionStorage.getItem('authToken');
        const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        timer = setTimeout(expire, Math.max(0, claims.exp * 1000 - Date.now()));
      } catch { timer = setTimeout(expire, 0); }
    }
    return () => { clearTimeout(timer); window.removeEventListener('customer-session-expired', expire); };
  }, [isLoggedIn]);
  useEffect(() => { if (user?.id && isLoggedIn) localStorage.setItem('wishlist:' + user.id, JSON.stringify(wishlistItems)); }, [wishlistItems, user?.id, isLoggedIn]);
  useEffect(() => { if (user?.id && isLoggedIn) localStorage.setItem('saved:' + user.id, JSON.stringify(savedForLater)); }, [savedForLater, user?.id, isLoggedIn]);

  const [addedToCartPopup, setAddedToCartPopup] = useState(null);

  const triggerAddedPopup = (item) => {
    setAddedToCartPopup({
      show: true,
      product: item,
      timestamp: Date.now(),
    });
  };

  const closeAddedPopup = () => {
    setAddedToCartPopup(null);
  };

  // eslint-disable-next-line no-unused-vars
  const loadCart = async (scopeProduct) => {
    const scope = cartScopeFor(scopeProduct);
    if (!scope.customerId || !scope.storeId) {
      setActiveCart(null);
      setCartItems(readGuestCartItems());
      setCartUnavailable(false);
      setCartError(scope.customerId ? 'Select a store before using the cart.' : '');
      return null;
    }
    setCartLoading(true);
    try {
      const cart = await getActiveCart(scope);
      return applyCartResponse(cart);
    } catch (error) {
      setActiveCart(null);
      setCartItems([]);
      if (error.status === 404) {
        setCartUnavailable(false);
        setCartError('');
        return null;
      }
      setCartUnavailable(isCartServiceUnavailable(error));
      setCartError(error.message || 'Cart Service is unavailable.');
      return null;
    } finally {
      setCartLoading(false);
    }
  };

  const ensureCart = async (scopeProduct, options = {}) => {
    const scope = cartScopeFor(scopeProduct);
    if (!scope.customerId) throw new Error('Log in to use your cart.');
    if (!scope.storeId) throw new Error('Select a store before using the cart.');
    if (activeCart?.id && activeCart.customerId === scope.customerId && activeCart.storeId === scope.storeId && activeCart.status === 'ACTIVE') return activeCart;
    try {
      const cart = await getActiveCart(scope);
      if (options.preserveVisibleItems) {
        setActiveCart(cart);
        setCartUnavailable(false);
        setCartError('');
        return cart;
      }
      return applyCartResponse(cart);
    } catch (error) {
      if (error.status !== 404) throw error;
      const cart = await createCart({ customerId: scope.customerId, storeId: scope.storeId });
      if (options.preserveVisibleItems) {
        setActiveCart(cart);
        setCartUnavailable(false);
        setCartError('');
        return cart;
      }
      return applyCartResponse(cart);
    }
  };

  const refreshCartTotal = async (cartId, options = {}) => {
    const cart = await calculateCartTotal(cartId);
    if (options.mergeStoreItems) return mergeCartResponse(cart);
    return applyCartResponse(cart);
  };

  // eslint-disable-next-line no-unused-vars
  const migrateGuestCartToCustomer = async (customerId) => {
    const guestItems = readGuestCartItems().map(adaptCartItem).filter((item) => item.productId && item.quantity > 0);
    if (!guestItems.length || !customerId) return false;
    const storeId = resolveCartStoreId(guestItems[0]);
    if (!storeId) {
      applyGuestCartItems(guestItems);
      setCartError('Select a store to sync your saved cart.');
      return false;
    }
    let cart;
    try {
      try {
        cart = await getActiveCart({ customerId, storeId });
      } catch (error) {
        if (error.status !== 404) throw error;
        cart = await createCart({ customerId, storeId });
      }
      for (const item of guestItems) {
        await addCartItem(cart.id, {
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
      localStorage.removeItem(GUEST_CART_KEY);
      await refreshCartTotal(cart.id);
      return true;
    } catch (error) {
      setCartUnavailable(isCartServiceUnavailable(error));
      setCartError(error.message || 'Could not sync your saved cart.');
      applyGuestCartItems(guestItems);
      return false;
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      return undefined;
    }
    const guestItems = readGuestCartItems();
    if (guestItems.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      applyGuestCartItems(guestItems);
    }
    return undefined;
  }, [isLoggedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = async (product) => {
    const itemPayload = buildCartItem(product);
    if (!itemPayload) return;
    if (isLoggedIn && currentCustomerId()) {
      const current = cartItems.find(item => sameCatalogItem(item, itemPayload));
      try {
        await validateCheckoutAvailability([{ storeId: itemPayload.storeId, items: [{ ...itemPayload, quantity: Number(current?.quantity || 0) + 1 }] }], findInventoryForItem);
        const cart = await ensureCart(itemPayload, { preserveVisibleItems: true });
        const existing = cartItems.find(item => sameCatalogItem(item, itemPayload));
        if (existing?.id) {
          await updateCartItem(cart.id, existing.id, { quantity: Number(existing.quantity || 0) + 1 });
        } else {
          await addCartItem(cart.id, {
            productId: itemPayload.productId,
            variantId: itemPayload.variantId,
            productName: itemPayload.productName,
            quantity: 1,
            unitPrice: itemPayload.unitPrice,
          });
        }
        await refreshCartTotal(cart.id, { mergeStoreItems: true });
        setCartError('');
        triggerAddedPopup(itemPayload);
        return;
      } catch (error) { setCartError(error.message); return; }
    }
    upsertGuestCartItem(itemPayload);
    triggerAddedPopup(itemPayload);
  };

  const updateQuantity = async (productId, variantId, delta, storeId = '') => {
    const match = { productId, variantId, storeId };
    const current = cartItems.find((item) => sameCatalogItem(item, match));
    if (isLoggedIn && currentCustomerId() && current && Number(delta) > 0) {
      try {
        await validateCheckoutAvailability([{ storeId: current.storeId, items: [{ ...current, quantity: Number(current.quantity) + Number(delta) }] }], findInventoryForItem);
        setCartError('');
      } catch (error) { setCartError(error.message); return; }
    }
    if (!isLoggedIn || activeCart?.id === GUEST_CART_ID) {
      const nextQuantity = Number(current?.quantity || 0) + Number(delta || 0);
      applyGuestCartItems(cartItems.flatMap((item) => {
        if (!sameCatalogItem(item, match)) return [item];
        return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity, totalPrice: Number(item.unitPrice || item.price || 0) * nextQuantity }] : [];
      }));
      return;
    }
    if (!activeCart?.id || !current?.id) return;
    const nextQuantity = Number(current.quantity || 0) + Number(delta || 0);
    setCartLoading(true);
    try {
      if (nextQuantity <= 0) {
        await removeCartItem(activeCart.id, current.id);
      } else {
        await updateCartItem(activeCart.id, current.id, { quantity: nextQuantity });
      }
      await refreshCartTotal(activeCart.id);
    } catch (error) {
      setCartUnavailable(isCartServiceUnavailable(error));
      setCartError(error.message || 'Cart Service is unavailable.');
    } finally {
      setCartLoading(false);
    }
  };

  const removeFromCart = async (productId, variantId, storeId = '') => {
    const match = { productId, variantId, storeId };
    const current = cartItems.find((item) => sameCatalogItem(item, match));
    if (!isLoggedIn || activeCart?.id === GUEST_CART_ID) {
      applyGuestCartItems(cartItems.filter((item) => !sameCatalogItem(item, match)));
      return;
    }
    if (!activeCart?.id || !current?.id) return;
    setCartLoading(true);
    try {
      await removeCartItem(activeCart.id, current.id);
      await refreshCartTotal(activeCart.id);
    } catch (error) {
      setCartUnavailable(isCartServiceUnavailable(error));
      setCartError(error.message || 'Cart Service is unavailable.');
    } finally {
      setCartLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isLoggedIn || activeCart?.id === GUEST_CART_ID) {
      applyGuestCartItems([]);
      return;
    }
    if (!activeCart?.id) return;
    setCartLoading(true);
    try {
      await clearCartItems(activeCart.id);
      await refreshCartTotal(activeCart.id);
    } catch (error) {
      setCartUnavailable(isCartServiceUnavailable(error));
      setCartError(error.message || 'Cart Service is unavailable.');
    } finally {
      setCartLoading(false);
    }
  };
  const toggleWishlist = (product) => setWishlistItems((items) => {
    const itemPayload = buildCartItem(product);
    if (!itemPayload) return items;
    const exists = items.some((item) => sameCatalogItem(item, itemPayload));
    return exists ? items.filter((item) => !sameCatalogItem(item, itemPayload)) : [...items, itemPayload];
  });
  const moveWishlistToCart = (product) => {
    addToCart(product);
    const itemPayload = buildCartItem(product);
    setWishlistItems((items) => items.filter((item) => !sameCatalogItem(item, itemPayload)));
  };
  const saveItemForLater = async (product) => {
    const itemPayload = adaptCartItem(product);
    if (!itemPayload?.productId) return;
    setSavedForLater((items) => {
      const existingIndex = items.findIndex((item) => sameCatalogItem(item, itemPayload));
      if (existingIndex < 0) return [...items, itemPayload];
      return items.map((item, index) => index === existingIndex ? { ...item, ...itemPayload } : item);
    });
    await removeFromCart(itemPayload.productId, itemPayload.variantId, itemPayload.storeId);
  };
  const removeSavedForLater = (product) => {
    const itemPayload = adaptCartItem(product);
    if (!itemPayload?.productId) return;
    setSavedForLater((items) => items.filter((item) => !sameCatalogItem(item, itemPayload)));
  };
  const restoreSavedItem = async (product) => {
    const itemPayload = adaptCartItem(product);
    if (!itemPayload?.productId) return;
    const quantity = Math.max(1, Number(itemPayload.quantity || 1));
    if (!isLoggedIn || activeCart?.id === GUEST_CART_ID) {
      const items = readGuestCartItems().map(adaptCartItem);
      const existingIndex = items.findIndex((item) => sameCatalogItem(item, itemPayload));
      const nextItems = [...items];
      if (existingIndex >= 0) {
        const current = nextItems[existingIndex];
        const nextQuantity = Number(current.quantity || 0) + quantity;
        nextItems[existingIndex] = { ...current, quantity: nextQuantity, totalPrice: Number(current.unitPrice || current.price || 0) * nextQuantity };
      } else {
        nextItems.push({ ...itemPayload, quantity, totalPrice: Number(itemPayload.unitPrice || itemPayload.price || 0) * quantity });
      }
      applyGuestCartItems(nextItems);
      setSavedForLater((items) => items.filter((item) => !sameCatalogItem(item, itemPayload)));
      return;
    }
    setCartLoading(true);
    try {
      const cart = await ensureCart(itemPayload);
      await addCartItem(cart.id, {
        productId: itemPayload.productId,
        variantId: itemPayload.variantId,
        productName: itemPayload.productName,
        quantity,
        unitPrice: itemPayload.unitPrice,
      });
      await refreshCartTotal(cart.id);
      setSavedForLater((items) => items.filter((item) => !sameCatalogItem(item, itemPayload)));
    } catch (error) {
      setCartUnavailable(isCartServiceUnavailable(error));
      setCartError(error.message || 'Could not move item back to cart.');
    } finally {
      setCartLoading(false);
    }
  };
  const addAddress = async (address) => {
    const saved = await customerProfileService.createAddress({ ...address, isDefault: true });
    const next = { ...saved, isDefault:true, coordinates:saved.latitude != null ? {lat:saved.latitude,lng:saved.longitude}:null, manualLocation:saved.street?{street:saved.street,city:saved.city||'',state:saved.state||'',pincode:saved.pincode||''}:null };
    setAddresses((items) => [...items.map((item)=>({...item,isDefault:false})),next]);
    setDeliveryAddress(next.address);
    return next;
  };
  const deleteAddress = async (id) => { await customerProfileService.deleteAddress(id); const remaining=addresses.filter((item)=>item.id!==id); if(remaining.length&&!remaining.some((item)=>item.isDefault))remaining[0]={...remaining[0],isDefault:true}; setAddresses(remaining); setDeliveryAddress((remaining.find((item)=>item.isDefault)||remaining[0])?.address||''); };
  const setDefaultAddress = async (id) => { const saved=await customerProfileService.setDefaultAddress(id); setAddresses((items)=>items.map((item)=>({...item,isDefault:item.id===id}))); setDeliveryAddress(saved.address); };
  const updateAddress = async (id,address) => { const saved=await customerProfileService.updateAddress(id,{...address,isDefault:addresses.find((item)=>item.id===id)?.isDefault}); const next={...saved,isDefault:saved.defaultAddress,coordinates:saved.latitude!=null?{lat:saved.latitude,lng:saved.longitude}:null,manualLocation:saved.street?{street:saved.street,city:saved.city||'',state:saved.state||'',pincode:saved.pincode||''}:null}; setAddresses((items)=>items.map((item)=>item.id===id?next:item)); if(next.isDefault)setDeliveryAddress(next.address); return next; };

  const [locale, setLocale] = useState(() => ({ language:readLanguage(localStorage), currency:localStorage.getItem('currency') || 'INR', timeZone:localStorage.getItem('timeZone') || Intl.DateTimeFormat().resolvedOptions().timeZone }));
  const updateLocale = (next) => {
    const value = { ...locale, ...next, language: normalizeLanguage(next.language || locale.language) };
    setLocale(value);
    persistLanguage(localStorage,value.language); localStorage.setItem('currency',value.currency); localStorage.setItem('timeZone',value.timeZone);
    document.documentElement.lang = languageCode(value.language);
  };
  const t = (key, values) => translate(locale.language, key, values);
  const formatCurrency = (amount) => cleanDisplayText(new Intl.NumberFormat(locale.language === 'Hindi' ? 'hi-IN' : locale.language === 'Telugu' ? 'te-IN' : 'en-IN', { style:'currency',currency:locale.currency }).format(Number(amount)));
  const formatDateTime = (value, options = {}) => new Intl.DateTimeFormat(locale.language === 'Hindi' ? 'hi-IN' : locale.language === 'Telugu' ? 'te-IN' : 'en-IN', { timeZone:locale.timeZone, ...options }).format(new Date(value));

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const saveSelectedLocation = (value) => {
    const next = {
      ...value,
      title: cleanLocationText(value.title),
      city: cleanLocationText(value.city),
      address: cleanLocationText(value.address),
      pincode: cleanLocationText(value.pincode),
    };
    const locationAddress = cleanLocationText(next.address || [next.title && next.title !== next.city ? next.title : '', next.city].filter(Boolean).join(', '));
    const nextCoordinates = next.latitude != null && next.longitude != null ? { lat: Number(next.latitude), lng: Number(next.longitude) } : null;
    storeSelectedLocation(next);
    setSelectedLocation(next);
    setUserCity(locationAddress || cleanLocationText([next.title && next.title !== next.city ? next.title : '', next.city].filter(Boolean).join(', ')));
    setDeliveryAddress(locationAddress);
    setAddresses((items) => {
      const normalized = items.map((item) => ({ ...item, isDefault: false }));
      const matchIndex = normalized.findIndex((item) => cleanLocationText(item.address) === locationAddress);
      if (matchIndex >= 0) {
        return normalized.map((item, index) => index === matchIndex ? {
          ...item,
          isDefault: true,
          address: locationAddress,
          latitude: Number(next.latitude),
          longitude: Number(next.longitude),
          coordinates: nextCoordinates,
          manualLocation: item.manualLocation || { street: next.address || '', city: next.city || '', state: next.state || '', pincode: next.pincode || '' },
        } : item);
      }
      return [{
        id: `selected-location-${Date.now()}`,
        type: 'Delivery location',
        address: locationAddress,
        isDefault: true,
        latitude: Number(next.latitude),
        longitude: Number(next.longitude),
        coordinates: nextCoordinates,
        manualLocation: { street: next.address || '', city: next.city || '', state: next.state || '', pincode: next.pincode || '' },
      }, ...normalized];
    });
    setShowLocationModal(false);
  };

  const clearSelectedLocation = () => {
    localStorage.removeItem('selectedLocation');
    setSelectedLocation(null);
    setUserCity('');
    setDeliveryAddress('');
    setShowLocationModal(false);
  };
  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        setUser,
        login,
        logout,
        cartCount,
        cartItems,
        activeCart,
        cartTotal,
        cartLoading,
        cartError,
        cartUnavailable,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        catalogProducts,
        catalogStoreProducts,
        catalogCategories,
        catalogBanners,
        catalogStores,
        updateCatalogStore,
        catalogLoading,
        catalogError,
        loadCatalog,
        loadCatalogProducts,
        loadCategoryProducts,
        resolveProductIdentity,
        sameCatalogItem,
        catalogItemKey,
        wishlistItems,
        toggleWishlist,
        moveWishlistToCart,
        savedForLater,
        saveItemForLater,
        restoreSavedItem,
        removeSavedForLater,
        addresses,
        orderAddresses,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        updateAddress,
        addedToCartPopup,
        triggerAddedPopup,
        closeAddedPopup,
        isCartOpen,
        openCart,
        closeCart,
        selectedCategory,
        setSelectedCategory,
        selectedProduct,
        setSelectedProduct,
        userCity,
        setUserCity,
        homeSearchQuery,
        setHomeSearchQuery,
        deliveryAddress,
        setDeliveryAddress,
        showLocationModal,
        setShowLocationModal,
        selectedLocation,
        deliveryMode,
        setDeliveryMode,
        saveSelectedLocation,
        clearSelectedLocation,
        locale,
        updateLocale,
        t,
        formatCurrency,
        formatDateTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};



