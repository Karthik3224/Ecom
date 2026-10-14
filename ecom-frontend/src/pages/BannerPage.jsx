import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AppContext } from '../context/AppContext';
import { collectionStore } from '../services/localDataService';
import { deliveryProducts } from '../utils/storeDelivery';
import ProductCard from '../components/ProductCard/ProductCard';
import SafeProductImage from '../components/SafeProductImage/SafeProductImage';

export default function BannerPage() {
  const { bannerId } = useParams();
  const { catalogBanners, catalogProducts, catalogStoreProducts, catalogStores, selectedLocation, catalogLoading, catalogError, loadCatalog } = useContext(AppContext);
  const banners = catalogBanners.length ? catalogBanners : collectionStore.list('banners');
  const banner = banners.find(item => String(item.id) === bannerId);
  const available = deliveryProducts(catalogProducts, catalogStoreProducts, catalogStores, selectedLocation);
  const products = available.filter(item => {
    if (banner?.store && item.storeId !== banner.store && item.storeName !== banner.store) return false;
    if (banner?.categoryId) return item.categoryId === banner.categoryId;
    return !/pickle/i.test(banner?.name || banner?.title || '') || /pickle/i.test(item.category || item.categoryName || item.name || item.title || '');
  });
  return <Box component="main" sx={{ minHeight: '100vh', bgcolor: '#f3f7f5', borderTop: '4px solid #087354' }}>
    <Box sx={{ px: { xs: 2, md: 5 }, py: 2, bgcolor: 'white', borderBottom: '1px solid #dce6e0' }}>
      <Button component={Link} to="/home" startIcon={<ArrowBackIcon />}>Home</Button>
    </Box>
    {catalogLoading && !banner ? <Box sx={{ p: 4 }}><CircularProgress aria-label="Loading banner" /></Box> : !banner ? <Box sx={{ p: 4 }}><Typography variant="h5">Banner unavailable</Typography></Box> : <>
      <Box sx={{ position: 'relative', minHeight: 260 }}>
        <SafeProductImage src={banner.image || banner.mobileImage} alt={banner.name || banner.title} style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block' }} />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,.45)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: { xs: 3, md: 5 } }}>
          <Typography component="h1" variant="h4" fontWeight={700}>{banner.name || banner.title}</Typography>
          <Typography sx={{ mt: 1 }}>{banner.description}</Typography>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 2, md: 5 }, py: 4 }}>
        <Typography component="h2" variant="h6" sx={{ mb: 3 }}>Products</Typography>
        {catalogError ? <Box role="alert"><Typography>{catalogError}</Typography><Button onClick={loadCatalog}>Retry</Button></Box> : catalogLoading ? <CircularProgress aria-label="Loading products" /> : products.length ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', sm: 'repeat(3,minmax(0,1fr))', lg: 'repeat(5,minmax(0,1fr))' }, gap: 2 }}>{products.map(item => <ProductCard key={`${item.storeId}:${item.productId || item.id}:${item.variantId || ''}`} {...item} />)}</Box> : <Typography>No products currently available for this banner at your location.</Typography>}
      </Box>
    </>}
  </Box>;
}
