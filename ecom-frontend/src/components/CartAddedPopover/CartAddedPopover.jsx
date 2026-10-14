import { useContext, useEffect } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import pickleJarImg from '../../assets/images/pickel-removebg-preview.png';
import './CartAddedPopover.css';
import { cleanDisplayText } from '../../utils/textEncoding';
import SafeProductImage from '../SafeProductImage/SafeProductImage';

const CartAddedPopover = () => {
  const navigate = useNavigate();
  const { addedToCartPopup, closeAddedPopup, isLoggedIn, openCart } = useContext(AppContext);

  useEffect(() => {
    if (addedToCartPopup && addedToCartPopup.show) {
      const timer = setTimeout(() => {
        closeAddedPopup();
      }, 4500);
      return () => clearTimeout(timer);
    }
  // The timestamp intentionally restarts the dismissal timer for each add event.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addedToCartPopup?.timestamp]);

  if (!addedToCartPopup || !addedToCartPopup.show) return null;

  const product = addedToCartPopup.product || {};
  const imageSrc = product.image || pickleJarImg;
  const title = cleanDisplayText(product.title || product.name || 'Product Item');
  const weight = cleanDisplayText(product.weight || product.pack || '500g');
  const price = product.price || '199';
  const originalPrice = Math.round(Number(price) * 1.25);

  const handleGoToCart = () => {
    closeAddedPopup();
    if (isLoggedIn) {
      navigate('/cart');
    } else {
      openCart();
    }
  };

  return (
    <Box className="cart-added-popover-card" key={addedToCartPopup.timestamp}>
      <Box className="popover-header">
        <Box className="popover-status-title">
          <CheckCircleIcon className="popover-check-icon" fontSize="small" />
          <Typography className="popover-status-text">Added to Cart</Typography>
        </Box>
        <IconButton className="popover-close-btn" onClick={closeAddedPopup} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className="popover-body">
        <Box className="popover-thumb">
          <SafeProductImage src={imageSrc} fallback={pickleJarImg} alt={title} />
        </Box>
        <Box className="popover-details">
          <Typography className="popover-product-title">{title}</Typography>
          <Typography className="popover-product-pack">1 pack ({weight}) &bull; 1</Typography>
          <Box className="popover-price-row">
            <span className="popover-price-badge">&#8377;{price}</span>
            <span className="popover-original-price">&#8377;{originalPrice}</span>
          </Box>
        </Box>
      </Box>

      <Button variant="outlined" className="popover-go-cart-btn" onClick={handleGoToCart}>
        Go to Cart <ChevronRightIcon fontSize="small" />
      </Button>
    </Box>
  );
};

export default CartAddedPopover;
