import { useContext } from 'react';
import { Box, Typography, Button, Drawer, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import './CartDrawer.css';
import SafeProductImage from '../SafeProductImage/SafeProductImage';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { isCartOpen, closeCart, cartItems, updateQuantity, clearCart, cartTotal, cartLoading, cartError, cartUnavailable, formatCurrency } = useContext(AppContext);

  const handleLoginProceed = () => {
    closeCart();
    navigate('/login', { state: { from: '/checkout', checkoutIntent: true, completeProfile: true } });
  };

  return (
    <Drawer
      anchor="right"
      open={isCartOpen}
      onClose={closeCart}
      classes={{ paper: 'cart-drawer-paper' }}
    >
      <Box className="cart-drawer-container">
        {/* Drawer Header */}
        <Box className="cart-header">
          <IconButton onClick={closeCart} size="small" className="back-btn">
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" className="cart-title">
            Cart
          </Typography>
        </Box>

        {/* Content */}
        {cartLoading && <Typography role="status" sx={{ px: 2, py: 1 }}>Updating cart...</Typography>}
        {cartError && <Typography role="alert" color={cartUnavailable ? 'error' : 'text.secondary'} sx={{ px: 2, py: 1 }}>{cartError}</Typography>}
        {cartItems.length === 0 ? (
          <Box className="empty-cart-container">
            <Box className="empty-cart-card">
              <Box className="bag-icon-wrapper">
                <Box className="bag-icon-inner">
                  <span className="bag-handle"></span>
                  <span className="bag-plus">+</span>
                </Box>
              </Box>
              <Typography className="empty-cart-text">
                Your cart is empty
              </Typography>
              <Button
                variant="contained"
                className="browse-products-btn"
                onClick={closeCart}
              >
                Browse Products
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Scrollable Content */}
            <Box className="cart-content-scroll">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
                <Button color="error" onClick={clearCart} disabled={cartLoading}>Clear cart</Button>
              </Box>
              {/* Cart Items Section */}
              <Box className="cart-section delivery-section">
                <Box className="cart-items-list">
                  {cartItems.map((item, idx) => (
                    <Box key={idx} className="cart-item-row">
                      <Box className="item-thumbnail">
                        {item.image ? (
                          <SafeProductImage src={item.image} alt={item.title} />
                        ) : (
                          <Box className="thumb-placeholder">ðŸ¥£</Box>
                        )}
                      </Box>

                      <Box className="item-details">
                        <Typography component="button" className="item-title" onClick={() => { closeCart(); navigate(`/product-info/${encodeURIComponent(item.productId || item.id)}`); }} sx={{ border:0, bgcolor:'transparent', textAlign:'left', cursor:'pointer' }}>{item.title}</Typography>
                        <Typography className="item-weight">{item.weight}</Typography>
                      </Box>

                      <Box className="item-right-col">
                        <Box className="qty-selector">
                          <button
                            className="qty-btn"
                          onClick={() => updateQuantity(item.productId, item.variantId, -1, item.storeId)}
                          >
                            -
                          </button>
                          <span className="qty-count">{item.quantity}</span>
                          <button
                            className="qty-btn"
                          onClick={() => updateQuantity(item.productId, item.variantId, 1, item.storeId)}
                          >
                            +
                          </button>
                        </Box>
                        <Box className="item-pricing">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="original-price">{formatCurrency(item.originalPrice)}</span>
                          )}
                          <span className="current-price" style={{ fontSize: 18, fontWeight: 600 }}>{formatCurrency(item.price)}</span>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Box className="add-more-prompt">
                  <Typography variant="body2">
                    Forgot something? <span className="add-more-link" onClick={closeCart}>Add More Items</span>
                  </Typography>
                </Box>
              </Box>

              {/* Bill Summary Section */}
              <Box className="cart-section bill-section">
                <Box className="bill-header">
                  <InsertDriveFileOutlinedIcon className="bill-icon" />
                  <Typography className="bill-title">Bill Summary</Typography>
                </Box>

                <Box className="bill-row total-row">
                  <Typography className="bill-label">Item Total</Typography>
                  <Typography className="bill-value">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cartTotal)}</Typography>
                </Box>

                <Box className="bill-note-card">
                  <Typography className="bill-note-text">
                    Log in to see your exact total. Applicable charges and discounts will be calculated based on your delivery details.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer: Login to Proceed Button */}
            <Box className="cart-footer">
              <Button
                variant="contained"
                fullWidth
                className="login-proceed-btn"
                onClick={handleLoginProceed}
              >
                Login to Proceed
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
