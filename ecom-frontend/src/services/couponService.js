import { collectionStore } from './localDataService';
import { promotionApplies, resolvedPromotionScope } from './promotionScope';

export const PENDING_COUPON_KEY = 'checkout:pendingCouponCode';
const SERVER_COUPONS_ENABLED = false;

export const listCoupons = () => collectionStore.list('coupons');

export const findCouponByCode = (code) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  return null;
};

export const savePendingCouponCode = (code) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized) localStorage.setItem(PENDING_COUPON_KEY, normalized);
};

export const consumePendingCouponCode = () => {
  const code = localStorage.getItem(PENDING_COUPON_KEY) || '';
  if (code) localStorage.removeItem(PENDING_COUPON_KEY);
  return code;
};

const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const itemProductName = (item, catalogProducts = []) => {
  const product = catalogProducts.find((product) => sameText(product.productId || product.id, item.productId || item.id));
  return item.title || item.productName || item.name || product?.title || product?.name || '';
};

const itemCategory = (item, catalogProducts = []) => {
  const product = catalogProducts.find((product) => sameText(product.productId || product.id, item.productId || item.id));
  return item.category || product?.category || product?.categoryName || '';
};

const itemStore = (item) => item.storeName || item.store || item.sourceStore || '';

const couponTargetsCart = (coupon, cartItems = [], catalogProducts = []) => {
  const productRule = String(coupon.product || '').trim();
  const categoryRule = String(coupon.category || '').trim();
  if (!productRule && !categoryRule) return true;
  return cartItems.some((item) => {
    const productMatches = !productRule || sameText(productRule, item.productId) || sameText(productRule, item.id) || sameText(productRule, itemProductName(item, catalogProducts));
    const categoryMatches = !categoryRule || sameText(categoryRule, itemCategory(item, catalogProducts));
    return productMatches && categoryMatches;
  });
};

export const cartPromotionContext = ({ cartItems = [], fallbackLocation = '', fallbackStore = '' } = {}) => {
  const stores = [...new Set(cartItems.map(itemStore).filter(Boolean))];
  const store = stores.length === 1 ? stores[0] : fallbackStore;
  const storeRecord = collectionStore.list('stores').find((item) => sameText(item.name, store) || sameText(item.id, store));
  const locations = [...new Set(cartItems.map((item) => item.location || item.storeLocation || '').filter(Boolean))];
  return {
    store,
    location: locations.length === 1 ? locations[0] : storeRecord?.location || fallbackLocation,
  };
};

export const calculateCouponDiscount = (coupon, subtotal) => {
  const value = Number(coupon?.discount || 0);
  const raw = coupon?.discountType === 'Fixed' ? value : Math.round(Number(subtotal || 0) * value / 100);
  return Math.min(raw, Number(coupon?.maximumDiscount || raw), Number(subtotal || 0));
};

export const validateCoupon = (coupon, { subtotal = 0, cartItems = [], catalogProducts = [], location = '', store = '' } = {}) => {
  if (!SERVER_COUPONS_ENABLED) return { valid:false, message:'Coupons are unavailable until server-side promotion configuration is enabled.' };
  if (!coupon) return { valid:false, message:'Coupon not found or inactive.' };
  if (coupon.active === false || coupon.status === 'Inactive') return { valid:false, message:'Coupon not found or inactive.' };
  const today = new Date().toISOString().slice(0, 10);
  if ((coupon.startDate && today < coupon.startDate) || (coupon.expiry && today > coupon.expiry)) return { valid:false, message:'This coupon is not valid today.' };
  const scoped = resolvedPromotionScope(coupon);
  if (!promotionApplies(scoped, { location, store })) return { valid:false, message:`This coupon is only valid for ${scoped.scope === 'Store' ? scoped.store : scoped.location || 'all India'}.` };
  if (Number(subtotal || 0) < Number(coupon.minimumOrder || 0)) return { valid:false, message:`Minimum order is ₹${Number(coupon.minimumOrder || 0).toFixed(2)}.` };
  if (cartItems.length && !couponTargetsCart(coupon, cartItems, catalogProducts)) return { valid:false, message:'This coupon is not valid for the selected products.' };
  return { valid:true, message:`${String(coupon.name || '').toUpperCase()} applied successfully.`, scoped };
};

export const validateCouponCode = (code, options) => {
  const coupon = findCouponByCode(code);
  const result = validateCoupon(coupon, options);
  return { coupon, ...result };
};
