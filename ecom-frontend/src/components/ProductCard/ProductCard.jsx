import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Button, Chip, IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { collectionStore } from '../../services/localDataService';
import { getCachedStoreDeliveryQuote } from '../../services/catalogApi';
import { deliverySummary } from '../../utils/storeDelivery';
import fallbackProductImage from '../../assets/images/mango_pickle_jar.png';
import './ProductCard.css';
import { findInventoryForItem } from '../../services/inventoryApi';
import { loadProductStock } from '../../utils/productStock.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dbVariantId = (value) => UUID_PATTERN.test(String(value || '')) ? value : null;

const ProductCard = ({ title, weight, price, image, ...details }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity, setSelectedProduct, wishlistItems, toggleWishlist, formatCurrency, sameCatalogItem, addresses, selectedLocation, t, user } = useContext(AppContext);
  const cardImage = image || '';
  const [imageSrc, setImageSrc] = useState(cardImage || fallbackProductImage);
  const selectedVariant = details.selectedVariant || details.variants?.[0] || {};
  const productId = details.productId || details.id || selectedVariant.productId;
  const variantId = details.variantId ?? selectedVariant.variantId ?? selectedVariant.id ?? null;
  const inventoryVariantId = dbVariantId(variantId);
  const hasProductIdentity = Boolean(productId) && variantId !== undefined;
  const stores = useMemo(() => collectionStore.list('stores'), []);
  const store = stores.find((item) => details.storeId ? item.id === details.storeId : item.name === details.store || item.name === details.storeName);
  const delivery = deliverySummary(store || details, formatCurrency);
  const [cardQuote, setCardQuote] = useState(details.deliveryQuote || null);
  const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0] || {};
  const customerLat = Number(selectedLocation?.latitude ?? defaultAddress.coordinates?.lat ?? defaultAddress.latitude);
  const customerLng = Number(selectedLocation?.longitude ?? defaultAddress.coordinates?.lng ?? defaultAddress.longitude);
  const cardRef = useRef(null);
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined');
  const [stock, setStock] = useState(null);
  const [stockAttempt, setStockAttempt] = useState(0);
  const stockStoreId = store?.id || details.storeId;
  const stockScope = `${user?.id}:${stockStoreId}:${productId}:${inventoryVariantId || 'product'}`;
  useEffect(() => {
    if (!user?.id || !inView || !stockStoreId || !productId) return undefined;
    let active = true;
    loadProductStock(findInventoryForItem, { storeId: stockStoreId, productId, variantId: inventoryVariantId })
      .then(result => { if (active) setStock({ scope: stockScope, attempt: stockAttempt, ...result }); });
    return () => { active = false; };
  }, [user?.id, inView, stockStoreId, productId, inventoryVariantId, stockScope, stockAttempt]);
  const currentStock = stock?.scope === stockScope && stock?.attempt === stockAttempt ? stock : null;
  const checkingStock = Boolean(user?.id && !currentStock);
  const stockError = Boolean(user?.id && currentStock?.state === 'error');
  const noStock = Boolean(user?.id && currentStock && currentStock.state !== 'available');
  useEffect(() => {
    const node = cardRef.current;
    if (!node || inView) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setInView(true); observer.disconnect(); }
    }, { rootMargin: '250px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);
  useEffect(() => {
    const quoteStoreId = store?.id;
    if (details.deliveryQuote) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCardQuote(details.deliveryQuote);
      return undefined;
    }
    if (!inView || !quoteStoreId || !Number.isFinite(customerLat) || !Number.isFinite(customerLng)) {
       
      setCardQuote(null);
      return undefined;
    }
    let ignore = false;
    getCachedStoreDeliveryQuote(quoteStoreId, { latitude:customerLat, longitude:customerLng })
      .then((payload) => { if (!ignore) setCardQuote(payload); })
      .catch(() => { if (!ignore) setCardQuote(null); });
    return () => { ignore = true; };
  }, [inView, details.deliveryQuote, details.storeId, store?.id, customerLat, customerLng]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageSrc(cardImage || fallbackProductImage);
  }, [cardImage]);
  const quote = cardQuote;
  const primaryMethod = quote?.methods?.find((method) => method.deliveryType === quote.selectedDeliveryMethod) || quote?.methods?.[0];
  const deliveryLine = quote?.deliveryAvailable
    ? `${quote.distanceKm} KM by road | ${primaryMethod?.deliveryType || 'Delivery'} ${primaryMethod?.estimatedTime || ''} ${Number(primaryMethod?.deliveryCharge ?? quote.deliveryCharge ?? 0) ? `| ${formatCurrency(primaryMethod?.deliveryCharge ?? quote.deliveryCharge)}` : '| Free'}`
    : `${delivery.etaLabel} | ${delivery.chargeLabel}`;

  const product = { ...details, id: productId, productId, variantId, selectedVariant, title, name:details.name || title, weight, price: Number(selectedVariant.price ?? price), image: cardImage, storeId:store?.id || details.storeId, store:store?.name || details.store || details.storeName };
  const cartItem = cartItems.find((item) => sameCatalogItem(item, product));
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = wishlistItems.some((item) => sameCatalogItem(item, product));

  const handleCardClick = () => {
    const resolvedProduct = {
      ...details,
      id: productId,
      productId,
      variantId,
      title: title || details.name || 'Product',
      subtitle: details.subtitle || details.category || '',
      description: details.description || '',
      highlights: details.highlights || [],
      aboutSource: details.aboutSource || '',
      price: Number(price || 0),
      weights: details.weights || [weight || '250g'],
      image: cardImage,
      gallery: details.gallery || [],
      storeId: store?.id || details.storeId,
      store: store?.name || details.store || details.storeName,
      storeName: store?.name || details.storeName || details.store,
    };
    setSelectedProduct(resolvedProduct);
    const targetId = resolvedProduct.productId || resolvedProduct.id || title;
    navigate(`/product-info/${encodeURIComponent(targetId)}`);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!checkingStock && !noStock && hasProductIdentity && Number(product.price) > 0) addToCart(product);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (!checkingStock && !noStock && hasProductIdentity && Number(product.price) > 0) addToCart(product);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(productId, variantId, -1, product.storeId);
  };

  return (
    <Box ref={cardRef} className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <Box className="product-image-container">
        <img
          src={imageSrc}
          alt={title}
          className="product-card-img"
          onError={() => setImageSrc(fallbackProductImage)}
        />
        <IconButton
          aria-label={isWishlisted ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
          onClick={(event) => { event.stopPropagation(); toggleWishlist(product); }}
          sx={{ position: 'absolute', top: 4, right: 4, color: isWishlisted ? '#ef4444' : '#64748b' }}
        >
          {isWishlisted ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Box className="product-info">
        <Typography className="product-title">{title}</Typography>
        {(store?.name || details.storeName || details.store) && <Typography className="product-store-line">{store?.name || details.storeName || details.store}</Typography>}
        <Typography className="product-delivery-line">{deliveryLine}</Typography>
        {details.offerType==='Buy X Get Y'&&<Chip size="small" color="success" label={`Buy ${details.buyQuantity||1}, get ${details.freeQuantity||1} free`} sx={{my:.5}}/>}
        <Box className="product-actions">
          <Box className="product-details">
            <Typography className="product-weight">{weight}</Typography>
            <Typography className="product-price">{Number(price) > 0 ? formatCurrency(price) : t('unavailable')}</Typography>
          </Box>
          {quantity === 0 ? (
            <Button variant="contained" className="add-btn" disabled={checkingStock || (noStock && !stockError) || details.active === false || !hasProductIdentity || !(Number(product.price) > 0)} onClick={(event) => { if (stockError) { event.stopPropagation(); setStockAttempt((attempt) => attempt + 1); } else handleAdd(event); }}>
              {checkingStock ? 'Checking' : stockError ? 'Retry stock' : currentStock?.state === 'missing' ? 'No stock record' : noStock || details.active === false || !hasProductIdentity || !(Number(product.price) > 0) ? t('out') : t('add')}
            </Button>
          ) : (
            <Box className="qty-control-box">
              <button type="button" className="qty-action-btn" onClick={handleDecrement}>
                -
              </button>
              <Typography className="qty-count-text">{quantity}</Typography>
              <button type="button" className="qty-action-btn" disabled={checkingStock || noStock || (user?.id && currentStock?.available <= quantity)} onClick={handleIncrement}>
                +
              </button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProductCard;
