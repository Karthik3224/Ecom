import { useContext } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import SafeProductImage from '../../components/SafeProductImage/SafeProductImage';
import './WishlistPage.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems, toggleWishlist, moveWishlistToCart, setSelectedProduct, homeSearchQuery, t, formatCurrency } = useContext(AppContext);

  const filteredItems = homeSearchQuery && homeSearchQuery.trim()
    ? wishlistItems.filter((item) => item.title.toLowerCase().includes(homeSearchQuery.toLowerCase()))
    : wishlistItems;

  const handleCardClick = (item) => {
    setSelectedProduct({
      ...item,
      productId: item.productId,
      variantId: item.variantId,
      title: item.title,
      weight: item.weight,
      price: item.price,
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
            {t('wishlist')} ({filteredItems.length})
          </Typography>
        </Box>
      </Box>

      <Box className="wishlist-scroll-content">
        {filteredItems.length > 0 ? (
          <Box className="wishlist-grid">
            {filteredItems.map((item) => (
              <Box key={`${item.productId}:${item.variantId}`} className="wishlist-card" onClick={() => handleCardClick(item)}>
                <Box className="wishlist-img-wrap">
                  <SafeProductImage src={item.image} alt={item.title} className="wishlist-img" />
                  <IconButton aria-label={`Remove ${item.title} from wishlist`} className="remove-heart-btn" onClick={(e) => { e.stopPropagation(); toggleWishlist(item); }}>
                    <FavoriteIcon style={{ color: '#ef4444' }} fontSize="small" />
                  </IconButton>
                </Box>

                <Box className="wishlist-card-body">
                  <Typography className="wishlist-card-title">{item.title}</Typography>
                  <Typography className="wishlist-card-weight">{item.weight}</Typography>

                  <Box className="wishlist-card-footer" onClick={(e) => e.stopPropagation()}>
                    <Typography className="wishlist-card-price">{formatCurrency(item.price)}</Typography>
                    <Button
                      variant="contained"
                      className="wishlist-add-btn"
                      onClick={() => moveWishlistToCart(item)}
                    >
                      {t('add')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="no-products-found">
            <Box className="no-products-content">
              <SearchOffOutlinedIcon style={{ fontSize: 64, color: '#94a3b8', marginBottom: 12 }} />
              <Typography className="no-products-title">
                {t('noWishlist')}
              </Typography>
              <Typography className="no-products-subtitle">
                {t('wishlistSearchEmpty', { query: homeSearchQuery })}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
};

export default WishlistPage;
