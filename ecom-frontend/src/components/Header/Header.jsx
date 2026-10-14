import { useContext, useRef } from 'react';
import { Box, Typography, InputBase, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TranslateIcon from '@mui/icons-material/Translate';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useAnimatedPlaceholder } from '../../hooks/useAnimatedPlaceholder';
import logo from '../../assets/images/logo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const animatedPlaceholder = useAnimatedPlaceholder();
  const searchInputRef = useRef(null);
  const { isLoggedIn, user, cartCount, openCart, selectedLocation, homeSearchQuery, setHomeSearchQuery, t, locale, setShowLocationModal, savedForLater } = useContext(AppContext);
  const cleanLabel = (value) => String(value || '').split(',').map((part) => part.trim()).filter((part) => part && !/^undefined$/i.test(part) && !/^null$/i.test(part)).join(', ');
  const selectedLocationLabel = cleanLabel(selectedLocation?.address || [selectedLocation?.title, selectedLocation?.city].filter(Boolean).join(', '));
  const deliveryLabel = selectedLocationLabel || t('selectDeliveryLocation');

  const handleCartClick = () => {
    if (isLoggedIn) {
      navigate('/cart');
    } else {
      openCart();
    }
  };
  return (
    <Box className="header-container">
      <Box className="header-left">
        <img src={logo} alt="Pickles & Spices" className="header-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }} />
        
        {(
          <Box className="header-user-info">
            <Typography className="greeting">{isLoggedIn ? t('greeting', { name: user?.name || t('customer') }) : t('deliveryLocation')}</Typography>
            <Box component="button" className="delivery-location" onClick={() => { sessionStorage.setItem('locationPickerManualOpen', 'true'); setShowLocationModal(true); }} style={{ cursor: 'pointer', background: 'none', border: 0, textAlign: 'left' }}>
              <Typography className="deliver-to">{t('deliverTo')}: <span className="location">{deliveryLabel}</span></Typography>
              <KeyboardArrowDownIcon className="arrow-down" />
            </Box>
          </Box>
        )}
      </Box>

      <Box className="header-search" sx={{ display: pathname.startsWith('/product') ? 'none' : undefined }}>
        <Box className="search-box" onClick={() => {
          searchInputRef.current?.focus();
        }}>
          <InputBase
            inputRef={searchInputRef}
            placeholder={locale.language === 'English' ? animatedPlaceholder : t('search')}
            className="search-input"
            value={homeSearchQuery}
            onChange={(e) => setHomeSearchQuery(e.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && homeSearchQuery.trim() && window.location.pathname !== '/home') navigate('/home'); }}
          />
          {homeSearchQuery ? (
            <CloseIcon
              onClick={(event) => { event.stopPropagation(); setHomeSearchQuery(''); searchInputRef.current?.focus(); }}
              style={{ color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 4 }}
            />
          ) : (
            <SearchIcon className="search-icon" onClick={() => {
              if (window.location.pathname !== '/home') {
                navigate('/home');
                window.setTimeout(() => searchInputRef.current?.focus(), 0);
                return;
              }
              window.setTimeout(() => searchInputRef.current?.focus(), 0);
            }} />
          )}
        </Box>
      </Box>

      <Box className="header-right">
        <Box className="action-item" onClick={() => navigate('/settings/language')} title="Language, currency and time zone">
          <TranslateIcon className="action-icon" />
          <Typography className="action-text">{locale.language}</Typography>
        </Box>
        <Box className="action-item" role="button" tabIndex={0} aria-label={t('wishlist')} onClick={() => navigate('/wishlist')} onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate('/wishlist'); }
        }}>
              <FavoriteBorderIcon className="action-icon" />
            <Typography className="action-text">{t('wishlist')}</Typography>
            </Box>
        {isLoggedIn ? (
          <>
            <Box className="action-item" onClick={() => navigate('/saved-for-later')}>
              <Badge badgeContent={savedForLater.length} color="success" className="cart-badge">
                <BookmarkBorderOutlinedIcon className="action-icon" />
              </Badge>
              <Typography className="action-text">{t('saved')}</Typography>
            </Box>
          </>
        ) : (
          <Box className="action-item" onClick={() => navigate('/intro')}>
            <PersonOutlineOutlinedIcon className="action-icon" />
            <Typography className="action-text">{t('login')}</Typography>
          </Box>
        )}
        <Box className="action-item" onClick={handleCartClick}>
          <Badge badgeContent={cartCount} color="success" className="cart-badge">
            <ShoppingCartOutlinedIcon className="action-icon" />
          </Badge>
          <Typography className="action-text">{t('cart')}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
