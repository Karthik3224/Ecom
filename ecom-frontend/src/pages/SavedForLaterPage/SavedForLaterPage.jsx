import { useContext } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import SafeProductImage from '../../components/SafeProductImage/SafeProductImage';
import '../WishlistPage/WishlistPage.css';
import './SavedForLaterPage.css';

const SavedForLaterPage = () => {
  const navigate = useNavigate();
  const { savedForLater, restoreSavedItem, removeSavedForLater, setSelectedProduct, homeSearchQuery, formatCurrency, cartLoading, t } = useContext(AppContext);

  const filteredItems = homeSearchQuery && homeSearchQuery.trim()
    ? savedForLater.filter((item) => String(item.title || '').toLowerCase().includes(homeSearchQuery.toLowerCase()))
    : savedForLater;

  const storeLabelFor = (item) => item.storeName || item.store || item.sourceStore || item.sourceStoreName || item.storeId || item.sourceStoreId || 'Store';
  const savedGroups = filteredItems.reduce((groups, item) => {
    const storeName = storeLabelFor(item);
    const group = groups.find((entry) => entry.storeName === storeName) || { storeName, items: [] };
    group.items.push(item);
    if (!groups.includes(group)) groups.push(group);
    return groups;
  }, []);

  const handleCardClick = (item) => {
    setSelectedProduct({
      ...item,
      productId: item.productId,
      variantId: item.variantId,
      title: item.title,
      weight: item.weight,
      price: item.price || item.unitPrice,
      subtitle: `Authentic ${item.title} | Traditional Recipe`,
      description: `Freshly prepared ${item.title} made using handpicked authentic ingredients.`,
      highlights: ['100% Homemade', 'Authentic Recipe', 'Pure Spices'],
      aboutSource: `Our ${item.title} is prepared using fresh ingredients sourced from local farms.`,
      image: item.image,
    });
    navigate(`/product-info/${encodeURIComponent(item.productId)}`);
  };

  return (
    <Box className="wishlist-page-wrapper">
      <Header />

      <Box className="wishlist-page-header">
        <Box className="wishlist-header-title-box">
          <IconButton onClick={() => navigate(-1)} style={{ color: '#ffffff' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" className="wishlist-title">
            {t('saved')} ({filteredItems.length})
          </Typography>
        </Box>
      </Box>

      <Box className="wishlist-scroll-content saved-later-page-scroll">
        {savedGroups.length > 0 ? (
          savedGroups.map((group) => (
            <Box className="saved-page-store-group" key={group.storeName}>
              <Box className="saved-page-store-title">
                <Typography>{group.storeName}</Typography>
                <span>{t('itemCount', { count: group.items.length })}</span>
              </Box>
              <Box className="wishlist-grid">
                {group.items.map((item) => (
                  <Box key={`${item.productId}:${item.variantId ?? 'product'}:${storeLabelFor(item)}`} className="wishlist-card" onClick={() => handleCardClick(item)}>
                    <Box className="wishlist-img-wrap">
                      <SafeProductImage src={item.image} alt={item.title} className="wishlist-img" />
                      <IconButton aria-label={`Remove ${item.title} from saved for later`} className="remove-heart-btn" onClick={(e) => { e.stopPropagation(); removeSavedForLater(item); }}>
                        <BookmarkRemoveOutlinedIcon style={{ color: '#ef4444' }} fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box className="wishlist-card-body">
                      <Typography className="wishlist-card-title">{item.title}</Typography>
                      <Typography className="wishlist-card-weight">{item.weight} &bull; {t('quantity')} {item.quantity || 1}</Typography>

                      <Box className="saved-page-actions" onClick={(e) => e.stopPropagation()}>
                        <Typography className="wishlist-card-price">{formatCurrency(item.price || item.unitPrice || 0)}</Typography>
                        <Box className="saved-page-buttons">
                          <Button variant="contained" className="wishlist-add-btn" disabled={cartLoading} onClick={() => restoreSavedItem(item)}>
                            {t('moveToCart')}
                          </Button>
                          <Button color="error" className="saved-page-remove-btn" disabled={cartLoading} onClick={() => removeSavedForLater(item)}>
                            {t('remove')}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))
        ) : (
          <Box className="no-products-found">
            <Box className="no-products-content">
              <SearchOffOutlinedIcon style={{ fontSize: 64, color: '#94a3b8', marginBottom: 12 }} />
              <Typography className="no-products-title">{t('noSaved')}</Typography>
              <Typography className="no-products-subtitle">
                {t('savedEmpty')}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
};

export default SavedForLaterPage;
