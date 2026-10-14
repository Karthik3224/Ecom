import { useContext, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, IconButton, Tabs, Tab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import pickleJarImg from '../../assets/images/pickel-removebg-preview.png';
import { AppContext } from '../../context/AppContext';
import { getCustomerOrderHistory, isOrderServiceUnavailable, normalizeOrder } from '../../services/orderApi';
import { orderStore } from '../../services/localDataService';
import './OrdersHistoryPage.css';

const OrdersHistoryPage = () => {
  const navigate = useNavigate();
  const { formatCurrency, user } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }
    let ignore = false;
    const timer = window.setTimeout(() => {
      if (!ignore) {
        setLoading(true);
        setError('');
      }
    }, 0);
    Promise.resolve().then(() => getCustomerOrderHistory(user.id))
      .then((payload) => {
        if (!ignore) {
          const rows = Array.isArray(payload) ? payload : payload?.orders || payload?.content || [];
          const localOrders = orderStore.list().filter((order) => order.customer?.id === user.id && ['DELIVERED', 'CANCELLED'].includes(order.status));
          const merged = [...localOrders, ...rows].filter((order, index, items) => items.findIndex((entry) => entry.id === order.id) === index);
          setOrders(merged.map(normalizeOrder));
          setUnavailable(false);
        }
      })
      .catch((apiError) => {
        if (!ignore) {
          setOrders(orderStore.list().filter((order) => order.customer?.id === user.id && ['DELIVERED', 'CANCELLED'].includes(order.status)).map(normalizeOrder));
          setUnavailable(isOrderServiceUnavailable(apiError));
          setError(isOrderServiceUnavailable(apiError) ? 'Order Service is unavailable. Please try again when backend is online.' : apiError.message);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [user?.id]);

  const displayOrders = useMemo(() => orders.filter((order) => activeTab === 0 ? order.status === 'DELIVERED' : order.status === 'CANCELLED'), [activeTab, orders]);

  return (
    <Box className="orders-history-wrapper">
      <Header />
      <Box className="orders-history-header">
        <Box className="orders-title-box">
          <IconButton onClick={() => navigate('/home')} style={{ color: '#ffffff' }}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" className="orders-header-title">My Orders History</Typography>
        </Box>
        <Box className="orders-tabs-wrap">
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} className="orders-tabs" TabIndicatorProps={{ style: { backgroundColor: '#ffffff', height: 3 } }}>
            <Tab label="Completed" className="tab-item" />
            <Tab label="Cancelled" className="tab-item" />
          </Tabs>
        </Box>
      </Box>

      <Box className="orders-history-scroll">
        {loading && <Box className="empty-orders-view"><Typography role="status">Loading order history...</Typography></Box>}
        {!loading && (error || !user?.id) && <Box className="empty-orders-view"><Typography role="alert" color={unavailable ? 'error' : 'text.secondary'}>{error || 'Log in to view your order history.'}</Typography></Box>}
        {!loading && !error && displayOrders.length === 0 && <Box className="empty-orders-view"><Typography variant="body1" color="textSecondary">No {activeTab === 0 ? 'completed' : 'cancelled'} orders found.</Typography></Box>}
        {!loading && !error && displayOrders.map((order) => (
          <Box key={order.id} className="order-history-card">
            <Box className="card-top-header">
              <Box className="header-left-info">
                <Typography className="card-order-id">{order.id}</Typography>
                <Typography className="card-order-date">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable'}</Typography>
              </Box>
              <Box className={`status-badge ${order.status.toLowerCase()}`}>
                {order.status === 'DELIVERED' ? <CheckCircleIcon className="status-icon" fontSize="small" /> : <CancelIcon className="status-icon" fontSize="small" />}
                <span>{order.status}</span>
              </Box>
            </Box>

            <Box className="card-items-divider" />
            <Box className="order-card-items-list">
              {order.items.length === 0 ? <Typography color="text.secondary">No order items were returned.</Typography> : order.items.map((item) => (
                <Box key={`${item.productId}:${item.variantId ?? 'product'}`} className="order-card-item-row">
                  <Box className="item-thumb-box"><img src={item.image || pickleJarImg} alt={item.title} /></Box>
                  <Box className="item-details-col">
                    <Typography className="item-title">{item.title}</Typography>
                    <Typography className="item-specs">Qty: {item.quantity}</Typography>
                  </Box>
                  <Typography className="item-price">{formatCurrency(item.totalPrice)}</Typography>
                </Box>
              ))}
            </Box>

            <Box className="card-bottom-footer">
              <Typography className="order-total-text">Total Paid: <span className="price-bold">{formatCurrency(order.totalAmount)}</span></Typography>
              <Button variant="outlined" className="reorder-btn" onClick={() => navigate(`/order-details/${encodeURIComponent(order.id)}`, { state: { orderId: order.id } })}>View Details</Button>
            </Box>
          </Box>
        ))}
      </Box>

      <BottomNav />
    </Box>
  );
};

export default OrdersHistoryPage;
