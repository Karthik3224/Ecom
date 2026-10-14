import { useContext, useEffect, useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import ProductCard from '../../components/ProductCard/ProductCard';
import CampaignCarousel from '../../components/CampaignCarousel/CampaignCarousel';
import { AppContext } from '../../context/AppContext';
import { collectionStore } from '../../services/localDataService';
import { promotionApplies } from '../../services/promotionScope';
import { savePendingCouponCode, validateCoupon } from '../../services/couponService';
import { getCachedStoreDeliveryQuote, getStoreProducts } from '../../services/catalogApi';
import { adaptStoreProductList } from '../../services/catalogAdapter';
import { deliverySummary, isGlobalProduct, isGlobalStore, storeDeliversTo } from '../../utils/storeDelivery';
import './StorePage.css';

const GLOBAL_STORE = {
  id: 'global-store',
  name: 'India-wide Global Store',
  address: 'India-wide delivery',
  location: 'All India',
  deliveryRadiusKm: 0,
  deliveryEtaMinutes: 0,
  deliveryCharge: 0,
  freeDeliveryAbove: 0,
  deliveryModes: '5-7 days delivery',
  deliveryNotes: 'India-wide products are delivered in 5-7 days.',
  delivery: 'Yes',
  status: 'Active',
  active: true,
  global: true,
};

const lineStringCoordinates = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) return geometry.coordinates;
  if (geometry.type === 'MultiLineString' && Array.isArray(geometry.coordinates)) return geometry.coordinates.flat();
  return [];
};

const routeBounds = (points, fallbackLat, fallbackLng, customerLat, customerLng) => {
  const coordinates = [
    ...points,
    [fallbackLng, fallbackLat],
    Number.isFinite(customerLat) && Number.isFinite(customerLng) ? [customerLng, customerLat] : null,
  ].filter((point) => point && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])));
  const lngs = coordinates.map((point) => Number(point[0]));
  const lats = coordinates.map((point) => Number(point[1]));
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lngPad = Math.max((maxLng - minLng) * 0.18, 0.01);
  const latPad = Math.max((maxLat - minLat) * 0.18, 0.01);
  return { minLng:minLng - lngPad, maxLng:maxLng + lngPad, minLat:minLat - latPad, maxLat:maxLat + latPad };
};

const mapPoint = (lng, lat, bounds) => ({
  x: ((Number(lng) - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
  y: ((bounds.maxLat - Number(lat)) / (bounds.maxLat - bounds.minLat)) * 100,
});

const StorePage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { userCity, catalogProducts, catalogBanners, formatCurrency, addresses, selectedLocation, setShowLocationModal, catalogStores, catalogLoading, deliveryMode, setDeliveryMode, cartCount, cartItems } = useContext(AppContext);
  const [storeProducts, setStoreProducts] = useState([]);
  const [quote, setQuote] = useState(null);
  const [offerMessage, setOfferMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    getStoreProducts(storeId, { status: 'ACTIVE' })
      .then((payload) => {
        if (!ignore) setStoreProducts(adaptStoreProductList(payload || []).map((item) => ({ ...item, storeId: item.storeId || storeId })));
      })
      .catch(() => {
        if (!ignore) setStoreProducts([]);
      });
    return () => { ignore = true; };
  }, [storeId]);

  const store = catalogStores.find((item) => item.id === storeId) || (storeId === GLOBAL_STORE.id ? GLOBAL_STORE : null);
  const globalStore = isGlobalStore(store);
  useEffect(() => {
    if (!store?.id) return;
    localStorage.setItem('selectedStoreId', store.id);
    localStorage.setItem('selectedStore', store.name || store.id);
  }, [store?.id, store?.name]);
  const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0] || {};
  const customerLat = Number(selectedLocation?.latitude ?? defaultAddress.coordinates?.lat ?? defaultAddress.latitude);
  const customerLng = Number(selectedLocation?.longitude ?? defaultAddress.coordinates?.lng ?? defaultAddress.longitude);
  useEffect(() => {
    if (!storeId || !Number.isFinite(customerLat) || !Number.isFinite(customerLng)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuote(null);
      return undefined;
    }
    let ignore = false;
    getCachedStoreDeliveryQuote(storeId, { latitude:customerLat, longitude:customerLng })
      .then((payload) => { if (!ignore) setQuote(payload); })
      .catch(() => { if (!ignore) setQuote(null); });
    return () => { ignore = true; };
  }, [storeId, customerLat, customerLng]);
  const bannerSource = catalogBanners.length ? catalogBanners : collectionStore.list('banners');
  const banners = store ? bannerSource.filter((item) => item.status === 'Active' && item.image && promotionApplies(item, { location: store.location, store: store.name })) : [];
  const coupons = store ? collectionStore.list('coupons').filter((item) => item.status === 'Active' && promotionApplies(item, { location: store.location, store: store.name })) : [];
  const mappedProductIds = new Set(storeProducts.filter((item) => item.storeId === storeId && item.status !== 'INACTIVE' && item.available !== false).map((item) => item.productId));
  const mappedProducts = storeProducts
    .filter((item) => item.product)
    .map((item) => ({ ...item.product, storeId: item.storeId, store: item.storeName || store?.name, storeName: item.storeName || store?.name }));
  const products = store ? [
    ...mappedProducts,
    ...catalogProducts.filter((item) => mappedProductIds.has(item.productId) || item.storeId === storeId || item.store === store.name || item.storeName === store.name || (globalStore && isGlobalProduct(item))),
  ].filter((product, index, items) => product.active !== false && items.findIndex((item) => (item.productId ?? item.id) === (product.productId ?? product.id)) === index) : [];

  const applyStoreOffer = (coupon) => {
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1), 0);
    savePendingCouponCode(coupon.name);
    if (!cartItems.length) {
      setOfferMessage(`${coupon.name} selected. Add eligible items from this store, then open cart or checkout to apply it.`);
      return;
    }
    const result = validateCoupon(coupon, { subtotal, cartItems, catalogProducts, location: store.location || userCity, store: store.name });
    setOfferMessage(result.valid ? `${coupon.name} selected. Discount will be applied in cart and checkout.` : result.message);
  };

  if (catalogLoading) return <Box className="store-page"><Header /><Typography>Loading store...</Typography></Box>;
  if (!store) return <Box className="store-page"><Header /><Box className="store-empty"><Typography variant="h6">Store not found</Typography><Button onClick={() => navigate('/home')}>Return home</Button></Box><BottomNav /></Box>;

  if (!globalStore && !storeDeliversTo(store, selectedLocation)) return <Box className="store-page"><Header /><Box className="store-empty"><Typography variant="h6">This store does not deliver to your selected location.</Typography><Button onClick={() => setShowLocationModal(true)}>Change location</Button><Button onClick={() => navigate('/home')}>See available stores</Button></Box><BottomNav /></Box>;

  const delivery = deliverySummary(store, formatCurrency);
  const quoteMethods = quote?.methods || [];
  const quoteEta = quote?.estimatedDeliveryMin && quote?.estimatedDeliveryMax ? `${quote.estimatedDeliveryMin}-${quote.estimatedDeliveryMax} min` : '';
  const quoteZone = quote?.matchedZoneLabel ? `${quote.matchedZoneLabel} service area` : '';
  const deliveryModes = quoteMethods.filter((method) => method.available !== false).map((method) => ({
    name: method.deliveryType,
    label: [method.deliveryType, method.estimatedTime, Number(method.deliveryCharge || 0) > 0 ? formatCurrency(method.deliveryCharge) : 'Free'].filter(Boolean).join(' - '),
  }));
  const lat = Number(store.latitude);
  const lng = Number(store.longitude);
  const hasMapPoint = Number.isFinite(lat) && Number.isFinite(lng);
  const routePoints = lineStringCoordinates(quote?.routeGeometry);
  const mapBounds = hasMapPoint ? routeBounds(routePoints, lat, lng, customerLat, customerLng) : null;
  const routeSvgPoints = mapBounds ? routePoints.map(([pointLng, pointLat]) => mapPoint(pointLng, pointLat, mapBounds)).map((point) => `${point.x},${point.y}`).join(' ') : '';
  const storePoint = mapBounds ? mapPoint(lng, lat, mapBounds) : null;
  const customerPoint = mapBounds && Number.isFinite(customerLat) && Number.isFinite(customerLng) ? mapPoint(customerLng, customerLat, mapBounds) : null;
  const radiusSize = `${Math.max(18, Math.min(92, Number(store.deliveryRadiusKm || 0) * 4))}%`;
  const mapUrl = hasMapPoint ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapBounds.minLng}%2C${mapBounds.minLat}%2C${mapBounds.maxLng}%2C${mapBounds.maxLat}&layer=mapnik` : '';

  return <Box className="store-page">
    <Header />
    <Box className="store-banner">
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      <Box className="store-heading"><StorefrontOutlinedIcon /><Box><Typography variant="h5">{store.name}</Typography><Typography>{store.address || store.location || userCity}</Typography></Box></Box>
      <Box className="store-badges">
        {quote?.distanceKm && <Chip label={`${quote.distanceKm} KM by road`} />}
        {quote?.routeDurationMinutes && <Chip label={`Road travel ~${quote.routeDurationMinutes} min`} />}
        {store.delivery !== 'No' && <Chip label={quote?.deliveryAvailable ? 'Delivery available' : delivery.radiusLabel} />}
        {store.delivery !== 'No' && <Chip label={quoteEta || delivery.etaLabel} />}
        {store.delivery !== 'No' && <Chip label={quote?.deliveryCharge != null ? `${formatCurrency(quote.deliveryCharge)} delivery charge` : delivery.chargeLabel} />}
        {store.pickup === 'Yes' && <Chip label="Pickup available" />}
      </Box>
      <Box sx={{ display:'flex', gap:1, mt:2, alignItems:'center', flexWrap:'wrap' }}>
        <Button variant={deliveryMode === 'delivery' ? 'contained' : 'outlined'} disabled={store.delivery === 'No'} onClick={() => setDeliveryMode('delivery')}>Delivery</Button>
        <Button variant={deliveryMode === 'pickup' ? 'contained' : 'outlined'} disabled={store.pickup === 'No'} onClick={() => setDeliveryMode('pickup')}>Pick-up</Button>
        <Button sx={{ ml:{ xs:0, sm:'auto' } }} variant="contained" color="success" onClick={() => navigate('/cart')}>View basket Â· {cartCount}</Button>
      </Box>
    </Box>
    <CampaignCarousel banners={banners} onNavigate={navigate} />
    {coupons.length > 0 && <Box sx={{ mx: { xs: 2, md: 5 }, my: 2, p: 2, bgcolor: '#eef8f3', borderRadius: 2 }}><Typography fontWeight={800}>Offers available at this store</Typography><Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>{coupons.map((coupon) => <Chip key={coupon.id} color="success" variant="outlined" clickable onClick={() => applyStoreOffer(coupon)} label={`${coupon.name} | ${coupon.discountType === 'Percentage' ? `${coupon.discount}% off` : `${formatCurrency(coupon.discount)} off`}`} />)}</Box>{offerMessage && <Typography role="status" sx={{ mt: 1, color: offerMessage.toLowerCase().includes('selected') ? '#075F40' : 'error.main', fontSize: 13 }}>{offerMessage}</Typography>}</Box>}
    <Box className="store-service-panel">
      <Box>
        <Typography variant="h6">Store service area</Typography>
        {quote?.distanceKm && <Typography>Road Distance: {quote.distanceKm} KM</Typography>}
        {quote?.routeDurationMinutes && <Typography>Driving Time: ~{quote.routeDurationMinutes} min</Typography>}
        {quoteZone && <Typography>{quoteZone}</Typography>}
        <Typography>{delivery.freeLabel}</Typography>
        <Typography>{quoteMethods.length ? `Available Delivery: ${quoteMethods.map((method) => `${method.deliveryType}${method.estimatedTime ? ` - ${method.estimatedTime}` : ''} - ${Number(method.deliveryCharge || 0) ? formatCurrency(method.deliveryCharge) : 'Free'}`).join(' | ')}` : delivery.modesLabel}</Typography>
        {store.deliveryNotes && <Typography>{store.deliveryNotes}</Typography>}
      </Box>
      {hasMapPoint && <Box className="store-radius-map">
        <iframe title={`${store.name} service map`} src={mapUrl} />
        {routeSvgPoints && <svg className="store-route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={routeSvgPoints} />
        </svg>}
        {storePoint && <i className="store-map-pin store-pin" style={{ left:`${storePoint.x}%`, top:`${storePoint.y}%` }}>Store</i>}
        {customerPoint && <i className="store-map-pin customer-pin" style={{ left:`${customerPoint.x}%`, top:`${customerPoint.y}%` }}>You</i>}
        <span style={{ width: radiusSize, height: radiusSize }}>{delivery.radiusLabel}</span>
      </Box>}
      {deliveryModes.length > 0 && <Box className="store-service-modes">{deliveryModes.map((mode) => <Chip key={mode.name} label={mode.label} sx={{ height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 1 } }} />)}</Box>}
    </Box>
    <Box className="store-products">
      <Typography variant="h6">Products in this store ({products.length})</Typography>
      {products.length ? <Box className="store-product-grid">{products.map((product) => <ProductCard key={product.id} {...product} storeId={store.id} store={store.name} storeName={store.name} deliveryQuote={quote} deliveryMode={deliveryMode} />)}</Box> : <Box className="store-empty"><Typography>No products are currently assigned to this store.</Typography></Box>}
    </Box>
    <BottomNav />
  </Box>;
};

export default StorePage;
