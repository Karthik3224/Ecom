import { useState, useContext, useEffect } from 'react';
import { Box, Typography, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Rating } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { collectionStore } from '../../services/localDataService';
import { getProduct, getProductVariants, getProductImages } from '../../services/catalogApi';
import { adaptProduct, adaptVariant } from '../../services/catalogAdapter';
import SafeProductImage from '../SafeProductImage/SafeProductImage';
import './ProductInfo.css';

const validWebUrl = (value) => { try { const parsed = new URL(value); return ['http:','https:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; } };
const youtubeEmbedUrl = (url) => { const safe=validWebUrl(url);if(!safe)return '';const parsed=new URL(safe);const id=parsed.hostname.includes('youtu.be')?parsed.pathname.slice(1):parsed.searchParams.get('v')||(parsed.pathname.includes('/embed/')?parsed.pathname.split('/embed/')[1]:'');return id?`https://www.youtube.com/embed/${encodeURIComponent(id)}`:safe; };
const parseVariants = (product) => {
  if (Array.isArray(product.variants)) return product.variants.map((item) => ({ ...item,variantId:item.variantId || item.id,label:item.label || item.size || item.weight || item.name }));
  return [];
};

const ProductInfo = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { selectedProduct, addToCart, updateQuantity, openCart, cartCount, cartItems, isLoggedIn, formatCurrency, catalogProducts, sameCatalogItem } = useContext(AppContext);
  const [imageIndex, setImageIndex] = useState(0);
  const [activeLink, setActiveLink] = useState(null);
  const [catalogProduct, setCatalogProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  useEffect(() => {
    const targetId = productId || selectedProduct?.productId || selectedProduct?.id || selectedProduct?.sku;
    if (!targetId) return;
    let ignore = false;
    const loadProduct = async () => {
      await Promise.resolve();
      if (ignore) return;
      setProductLoading(true);
      setProductError(null);
      const [productResponse, variantsResponse, imagesResponse] = await Promise.all([
      getProduct(targetId),
      getProductVariants(targetId),
      getProductImages(targetId),
      ]);
        if (ignore) return;
        const baseProduct = adaptProduct(productResponse || {});
        const availableVariants = (Array.isArray(variantsResponse) ? variantsResponse : []).map((variant) => adaptVariant(variant, baseProduct));
        const availableImages = Array.isArray(imagesResponse) ? imagesResponse.map((image) => image.url || image.imageUrl || image.path).filter((url) => url && !/^(?:https?:)?\/\/(?:www\.)?loremflickr\.com(?:\/|$)/i.test(url)) : [];
        const mergedProduct = {
          ...baseProduct,
          variants: availableVariants.length ? availableVariants : baseProduct.variants || [],
          gallery: availableImages.length ? availableImages : baseProduct.gallery || [],
          image: availableImages[0] || baseProduct.image || '',
          weights: (availableVariants.length ? availableVariants.map((variant) => variant.label || variant.weight || variant.name) : baseProduct.weights || [baseProduct.weight || '500g']).filter(Boolean),
        };
        setCatalogProduct(mergedProduct);
    };
    loadProduct()
      .catch((error) => {
        if (ignore) return;
        setProductError(error.message || 'The product could not be loaded.');
        console.warn('Catalog product detail request failed:', error);
      })
      .finally(() => {
        if (!ignore) setProductLoading(false);
      });
    return () => { ignore = true; };
  }, [productId, selectedProduct]);

  const product = catalogProduct || {
    title: productLoading ? 'Loading product' : 'Product unavailable',
    subtitle: productError || 'Catalog product details are not available.',
    description: '',
    image: '',
    variants: [],
  };
  const variantOptions = parseVariants(product).filter((variant) => variant.label);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const effectiveVariantId = variantOptions.some((variant) => (variant.variantId || variant.id) === selectedVariantId) ? selectedVariantId : variantOptions[0]?.variantId || variantOptions[0]?.id || '';
  const selectedVariant = variantOptions.find((variant) => (variant.variantId || variant.id) === effectiveVariantId) || variantOptions[0];
  const selectedWeight = selectedVariant?.label || selectedVariant?.weight || product.weight || '';
  const isOutOfStock = product.active === false || selectedVariant?.active === false || (variantOptions.length > 0 && !selectedVariant);

  const bestSellers = catalogProducts.filter((item) => item.productId !== product.productId).slice(0, 3);
  const productImages = [product.image, ...(product.gallery || [])].filter((image, index, values) => image && values.indexOf(image) === index);
  const externalLinks = [
    { label: 'Website', url: product.websiteUrl },
    { label: 'YouTube', url: product.youtubeUrl },
    { label: 'Instagram', url: product.instagramUrl },
    { label: 'Facebook', url: product.facebookUrl },
    { label: 'Telegram', url: product.telegramUrl },
  ].map((link) => ({ ...link,url:validWebUrl(link.url) })).filter((link) => link.url);
  const productVideos = [product.videoUrl, ...String(product.videoUrls || '').split('\n')].map(validWebUrl).filter((url,index,items) => url && items.indexOf(url) === index);
  const specifications = String(product.specifications || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const tags = (Array.isArray(product.tags) ? product.tags : String(product.tags || '').split(',')).map((tag) => String(tag).trim()).filter(Boolean);
  const productKey = product.id || product.sku || product.title;
  const approvedRatings = collectionStore.list('reviews').filter((review) => review.status === 'Approved' && review.active !== false && (!review.productId || review.productId === productKey));
  const averageRating = approvedRatings.length ? approvedRatings.reduce((sum,review) => sum + Number(review.rating || 0),0) / approvedRatings.length : 0;

  const itemTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const cartItem = cartItems.find((item) => sameCatalogItem(item, { productId: product.productId, variantId: selectedVariant?.variantId || selectedVariant?.id }));
  const productQuantity = cartItem ? cartItem.quantity : 0;

  const handleViewCart = () => {
    if (isLoggedIn) {
      navigate('/cart');
    } else {
      openCart();
    }
  };

  const handleAddProduct = () => {
    addToCart({
      ...product,
      productId: product.productId || product.id,
      variantId: selectedVariant?.variantId ?? selectedVariant?.id ?? null,
      selectedVariant,
      title: product.title,
      weight: selectedWeight,
      variantSku: selectedVariant?.sku,
      price: Number(selectedVariant?.price ?? 0),
      image: product.image,
    });
  };

  return (
    <Box className="product-info-wrapper">
      {/* Top Header Bar */}
      <Box className="product-info-header">
        <IconButton onClick={() => navigate(-1)} className="header-back-btn">
          <ArrowBackIcon style={{ color: '#ffffff' }} />
        </IconButton>
      </Box>

      {/* Content Scroll View */}
      <Box className="product-info-scroll">
        {/* Main Product Image Banner */}
        <Box className="product-banner-wrap">
          {productImages.length ? <SafeProductImage src={productImages[imageIndex]} alt={`${product.title} view ${imageIndex + 1}`} className="product-main-img" /> : <Box className="product-main-img product-main-img-empty">No image specified</Box>}
          <Box className="carousel-dots">
            {productImages.map((_, index) => <button type="button" aria-label={`View image ${index + 1}`} key={index} className={`dot ${imageIndex === index ? 'active' : ''}`} onClick={() => setImageIndex(index)} />)}
          </Box>
        </Box>

        {/* Product Details Section */}
        <Box className="product-details-content">
          <Typography className="product-info-title">{product.title}</Typography>
          <Typography className="product-info-subtitle">
            {product.subtitle || 'Not specified'}
          </Typography>

          {/* Weight Selectors */}
          <Box className="weight-options-row">
            <ScaleOutlinedIcon style={{ color: '#64748b', fontSize: 20 }} />
            {variantOptions.map((variant, idx) => (
              <Button
                key={idx}
                className={`weight-chip ${selectedWeight === variant.label ? 'selected' : ''}`}
                onClick={() => setSelectedVariantId(variant.variantId || variant.id)}
                disabled={variant.active === false}
              >
                {variant.label}{Number(variant.price) !== Number(product.price) ? ` · ${formatCurrency(variant.price)}` : ''}
              </Button>
            ))}
          </Box>

          {/* Description */}
          <Typography className="product-description-text">
            {product.description || 'Not specified'}
          </Typography>
          <Box className={`availability-status ${isOutOfStock ? 'out' : ''}`}><Typography>{isOutOfStock ? 'Unavailable' : 'Available'}</Typography></Box>

          <Box className="info-block"><Typography className="info-block-heading">Ingredients</Typography><Typography>{product.ingredients || 'Not specified'}</Typography></Box>
          <Box className="info-block"><Typography className="info-block-heading">Specifications</Typography>{specifications.length ? <Box className="specification-list">{specifications.map((specification) => { const [label,...value]=specification.split(':');return <Box key={specification}><Typography>{label}</Typography><Typography>{value.join(':').trim() || '-'}</Typography></Box>; })}</Box> : <Typography>Not specified</Typography>}</Box>
          <Box className="info-block"><Typography className="info-block-heading">Tags</Typography>{tags.length ? <Box className="tag-list">{tags.map((tag) => <Chip key={tag} label={tag} size="small" />)}</Box> : <Typography>Not specified</Typography>}</Box>
          {(productVideos.length > 0 || externalLinks.length > 0) && <Box className="info-block"><Typography className="info-block-heading">Product Media & Links</Typography><Box className="product-video-grid">{productVideos.map((url) => url.includes('youtu') ? <iframe key={url} title={`${product.title} video`} src={youtubeEmbedUrl(url)} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <video key={url} controls src={url} />)}</Box><Box className="media-link-list">{externalLinks.map((link) => <Box key={link.label} className="media-link-row"><Typography>{link.label}</Typography><Box><Button size="small" startIcon={<VisibilityOutlinedIcon />} onClick={() => setActiveLink(link)}>Open here</Button><Button size="small" startIcon={<LaunchOutlinedIcon />} onClick={() => window.open(link.url,'_blank','noopener,noreferrer')}>External</Button></Box></Box>)}</Box></Box>}
          <Button variant="outlined" onClick={() => navigate('/reviews')} sx={{ justifyContent:'flex-start',gap:1,textTransform:'none' }}><Rating readOnly size="small" precision={0.1} value={averageRating} /> {averageRating ? `${averageRating.toFixed(1)} · ${approvedRatings.length} reviews` : 'No approved reviews yet'}</Button>

          {/* Highlights */}
          <Box className="info-block">
            <Typography className="info-block-heading">Highlights:</Typography>
            <ul className="highlights-list">
              {(
                product.highlights?.length ? product.highlights : ['Not specified']
              ).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </Box>

          {/* About the Source */}
          <Box className="info-block">
            <Typography className="info-block-heading">About the Source</Typography>
            <Typography className="about-source-text">
              {product.aboutSource || 'Not specified'}
            </Typography>
          </Box>

          {/* Bestsellers Section */}
          <Box className="info-block bestsellers-block">
            <Typography className="info-block-heading">Bestsellers</Typography>
            <Box className="bestsellers-scroll-row">
              {bestSellers.map((item, idx) => (
                <ProductCard
                  key={idx}
                  {...item}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Floating Cart Bar if cart has items */}
      {cartCount > 0 && (
        <Box className="floating-cart-bar" onClick={handleViewCart}>
          <Typography className="floating-cart-left">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} | {formatCurrency(itemTotal)}
          </Typography>
          <Box className="floating-cart-right">
            <span>View cart</span>
            <ChevronRightIcon fontSize="small" />
          </Box>
        </Box>
      )}

      {/* Bottom Sticky Action Bar */}
      <Box className="sticky-bottom-bar">
        <Box className="price-info">
          <Typography className="bottom-price">{formatCurrency(selectedVariant?.price || product.price)}</Typography>
          <Typography className="taxes-note">(incl. of all taxes)</Typography>
        </Box>
        {productQuantity > 0 ? (
          <Box className="sticky-qty-selector">
            <button
              className="sticky-qty-btn"
              onClick={() => updateQuantity(product.productId, selectedVariant?.variantId || selectedVariant?.id, -1)}
            >
              -
            </button>
            <span className="sticky-qty-count">{productQuantity}</span>
            <button
              className="sticky-qty-btn"
              onClick={() => updateQuantity(product.productId, selectedVariant?.variantId || selectedVariant?.id, 1)}
            >
              +
            </button>
          </Box>
        ) : (
          <Button className="bottom-add-btn" disabled={isOutOfStock} onClick={handleAddProduct}>
            {isOutOfStock ? 'OUT OF STOCK' : 'ADD +'}
          </Button>
        )}
      </Box>
      <Dialog open={Boolean(activeLink)} onClose={() => setActiveLink(null)} fullWidth maxWidth="md"><DialogTitle>{activeLink?.label}</DialogTitle><DialogContent className="in-app-browser"><iframe title={`${activeLink?.label || 'Product'} in-app viewer`} src={activeLink?.label === 'YouTube' ? youtubeEmbedUrl(activeLink?.url) : activeLink?.url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" /></DialogContent><DialogActions><Button onClick={() => setActiveLink(null)}>Close</Button><Button startIcon={<LaunchOutlinedIcon />} onClick={() => window.open(activeLink?.url,'_blank','noopener,noreferrer')}>Open externally</Button></DialogActions></Dialog>
    </Box>
  );
};

export default ProductInfo;
