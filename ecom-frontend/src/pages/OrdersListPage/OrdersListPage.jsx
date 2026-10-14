import { useContext, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button, IconButton, InputBase, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import { AppContext } from '../../context/AppContext';
import pickleJarImg from '../../assets/images/pickel-removebg-preview.png';
import { getCustomerOrders, isOrderServiceUnavailable, normalizeOrder, ORDER_STATUSES } from '../../services/orderApi';
import './OrdersListPage.css';

const tokenCustomerId = () => {
  try {
    const token = sessionStorage.getItem('authToken') || '';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.customerId || '';
  } catch {
    return '';
  }
};

const OrdersListPage = () => {
  const navigate = useNavigate();
  const { formatCurrency, user } = useContext(AppContext);
  const customerId = tokenCustomerId() || user?.id || '';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTime, setSelectedTime] = useState('Anytime');
  const [appliedStatus, setAppliedStatus] = useState('All');
  const [appliedTime, setAppliedTime] = useState('Anytime');
  const [filterReferenceTime] = useState(() => Date.now());

  useEffect(() => {
    if (!customerId) {
      return undefined;
    }
    let ignore = false;
    const timer = window.setTimeout(() => {
      if (!ignore) {
        setLoading(true);
        setError('');
      }
    }, 0);
    Promise.resolve().then(() => getCustomerOrders(customerId))
      .then((payload) => {
        if (!ignore) {
          const rows = Array.isArray(payload) ? payload : payload?.orders || payload?.content || [];
          setOrders(rows.map(normalizeOrder));
          setUnavailable(false);
        }
      })
      .catch((apiError) => {
        if (!ignore) {
          setOrders([]);
          setUnavailable(isOrderServiceUnavailable(apiError));
          setError(isOrderServiceUnavailable(apiError) ? 'Order Service is unavailable. Please try again when backend is online.' : apiError.message);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [customerId]);

  const viewOrders = useMemo(() => orders.map((order) => {
    const first = order.items[0] || {};
    return {
      ...order,
      title: first.title || 'Order',
      weight: first.quantity ? `${first.quantity} item${first.quantity === 1 ? '' : 's'}` : `${order.items.length} items`,
      price: order.totalAmount,
      date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Date unavailable',
      image: first.image || pickleJarImg,
      deliverySummary: order.deliveryLines?.length ? order.deliveryLines.map((line) => `${line.title}: ${line.deliveryLabel}`).join(' | ') : first.deliveryLabel || first.estimatedDelivery || '',
    };
  }), [orders]);

  const handleApplyFilters = () => {
    setAppliedStatus(selectedStatus);
    setAppliedTime(selectedTime);
    setIsFilterModalOpen(false);
  };

  const handleOpenFilters = () => {
    setSelectedStatus(appliedStatus);
    setSelectedTime(appliedTime);
    setIsFilterModalOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedStatus('All');
    setSelectedTime('Anytime');
    setAppliedStatus('All');
    setAppliedTime('Anytime');
    setIsFilterModalOpen(false);
  };

  const filteredOrders = viewOrders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = order.title.toLowerCase().includes(query) || order.id.toLowerCase().includes(query);
    const matchesStatus = appliedStatus === 'All'
      || String(order.status || '').toUpperCase() === String(appliedStatus).toUpperCase();
    const createdAt = new Date(order.createdAt).getTime();
    const maximumAge = appliedTime === 'Last 30 days' ? 30 * 86400000
      : appliedTime === 'Last 6 Months' ? 183 * 86400000
        : appliedTime === 'Last year' ? 365 * 86400000 : Infinity;
    const matchesTime = maximumAge === Infinity || (Number.isFinite(createdAt)
      && filterReferenceTime - createdAt <= maximumAge && createdAt <= filterReferenceTime);
    return matchesSearch && matchesStatus && matchesTime;
  });

  return (
    <Box className="orders-list-wrapper">
      <Header />

      <Box className="orders-list-header">
        <IconButton onClick={() => navigate('/profile')} style={{ color: '#ffffff' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" className="orders-header-title">Orders</Typography>
      </Box>

      <Box className="orders-search-filter-bar">
        <Box className="orders-search-input-box">
          <SearchIcon className="search-icon-gray" />
          <InputBase placeholder="Search for orders" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="orders-search-input" />
          {searchQuery && <IconButton size="small" onClick={() => setSearchQuery('')}><CloseIcon style={{ fontSize: 16, color: '#94a3b8' }} /></IconButton>}
        </Box>
        <IconButton className="filter-tune-btn" aria-label="Open order filters" onClick={handleOpenFilters}>
          <TuneIcon style={{ color: '#075F40' }} />
        </IconButton>
      </Box>

      {(appliedStatus !== 'All' || appliedTime !== 'Anytime') && (
        <Box className="applied-filter-bar">
          <Typography className="filter-chip-text">Filter: {appliedStatus !== 'All' ? appliedStatus : ''} {appliedTime !== 'Anytime' ? `- ${appliedTime}` : ''}</Typography>
          <Button size="small" className="reset-chip-btn" onClick={handleClearFilters}>Reset</Button>
        </Box>
      )}

      <Box className="orders-list-scroll">
        {loading && <Box className="no-orders-box"><Typography role="status">Loading orders...</Typography></Box>}
        {!loading && (error || !customerId) && <Box className="no-orders-box"><Typography role="alert" color={unavailable ? 'error' : 'text.secondary'}>{error || 'Log in to view your orders.'}</Typography></Box>}
        {!loading && !error && filteredOrders.length === 0 && <Box className="no-orders-box"><Typography variant="body1" color="textSecondary">{orders.length === 0 ? 'No orders found.' : 'No orders matching your criteria.'}</Typography></Box>}
        {!loading && !error && filteredOrders.map((order) => (
          <Box key={order.id} className="order-card-row" role="button" tabIndex={0} aria-label={`View order ${order.id}`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/order-details/${encodeURIComponent(order.id)}`, { state: { orderId: order.id } }); } }} onClick={() => navigate(`/order-details/${encodeURIComponent(order.id)}`, { state: { orderId: order.id } })}>
            <Box className="order-thumb-wrap">
              <img src={order.image} alt={order.title} />
            </Box>
            <Box className="order-info-col">
              <Box className="order-top-line">
                <Typography className="order-item-name">{order.title}</Typography>
                <Typography className="order-item-price">{formatCurrency(order.price)}</Typography>
              </Box>
              <Typography className="order-item-weight">{order.weight}</Typography>
              <Typography className="order-item-weight">Order ID: {order.id}</Typography>
              {order.deliverySummary && <Typography className="order-item-weight">{order.deliverySummary}</Typography>}
              <Typography className="order-date-note">Ordered on : {order.date}</Typography>
            </Box>
            <span className={`status-pill-chip ${order.status.toLowerCase()}`}>{order.status}</span>
          </Box>
        ))}
      </Box>

      {isFilterModalOpen && (
        <Box className="filter-modal-backdrop" role="presentation" onClick={() => setIsFilterModalOpen(false)}>
          <Box className="filter-modal-card" role="dialog" aria-modal="true" aria-labelledby="filter-orders-title" onClick={(event) => event.stopPropagation()}>
            <Box className="filter-modal-header">
              <Typography id="filter-orders-title" className="filter-modal-title">Filter Orders</Typography>
              <IconButton aria-label="Close order filters" onClick={() => setIsFilterModalOpen(false)}><CloseIcon /></IconButton>
            </Box>
            <Box className="filter-modal-body">
              <Box className="filter-sections-side-by-side">
                <Box className="filter-section">
                  <Typography className="filter-section-label">status</Typography>
                  <RadioGroup value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-radio-group">
                    {['All', ...ORDER_STATUSES].map((status) => <FormControlLabel key={status} value={status} control={<Radio className="green-radio" />} label={status} className="filter-radio-label" />)}
                  </RadioGroup>
                </Box>
                <Box className="filter-vertical-divider" />
                <Box className="filter-section">
                  <Typography className="filter-section-label">Time</Typography>
                  <RadioGroup value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="filter-radio-group">
                    {['Anytime', 'Last 30 days', 'Last 6 Months', 'Last year'].map((time) => <FormControlLabel key={time} value={time} control={<Radio className="green-radio" />} label={time} className="filter-radio-label" />)}
                  </RadioGroup>
                </Box>
              </Box>
            </Box>
            <Box className="filter-modal-footer">
              <Button variant="outlined" className="clear-filters-btn" onClick={handleClearFilters}>Clear Filters</Button>
              <Button variant="contained" className="apply-filters-btn" onClick={handleApplyFilters}>Apply Filters</Button>
            </Box>
          </Box>
        </Box>
      )}

      <BottomNav />
    </Box>
  );
};

export default OrdersListPage;
