import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { advanceManagerDemoOrder, DEMO_TRACKING_STAGES, listManagerDemoOrders, readManagedDemoTracking } from '../utils/demoTracking';

export default function ManagerDemoOrders({ actor }) {
  const [, setRevision] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('storage', refresh);
    const timer = window.setInterval(refresh, 3000);
    return () => { window.removeEventListener('storage', refresh); window.clearInterval(timer); };
  }, []);
  const handleAdvance = useCallback((order, nextIndex) => {
    try {
      advanceManagerDemoOrder(localStorage, actor, order.customerId, order.id, nextIndex, Date.now());
      window.dispatchEvent(new Event('demo-tracking-updated'));
      setRevision((value) => value + 1);
      setError('');
    } catch (reason) { setError(reason.message); }
  }, [actor]);
  if (!import.meta.env.DEV || !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) || actor?.role !== 'store-manager') return null;
  const orders = listManagerDemoOrders(localStorage, actor);
  return <Box component="section" sx={{ my: 2, py: 2, borderBottom: '1px solid #e2e8f0' }}>
    <Typography variant="h6">Store Demo Orders</Typography>
    <Alert severity="info" sx={{ my: 1 }}>Local presentation records only. Updates reflect in the customer demo details in this browser and origin; no real shipment is changed.</Alert>
    {error && <Alert severity="error">{error}</Alert>}
    {!orders.length && <Typography>No demo orders for your assigned store in this browser.</Typography>}
    {orders.map((order) => {
      const tracking = readManagedDemoTracking(localStorage, order.customerId, order, order.createdAt);
      return <Box key={order.id} sx={{ py: 2, borderBottom: '1px solid #e2e8f0' }}><Typography fontWeight={700}>{order.storeName || order.storeId}</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>Order: {order.id}</Typography>{order.paymentId && <Typography sx={{ overflowWrap: 'anywhere' }}>Demo payment reference: {order.paymentId}</Typography>}{order.checkoutId && <Typography sx={{ overflowWrap: 'anywhere' }}>Checkout: {order.checkoutId}</Typography>}<Typography>{order.items.map((item) => `${item.quantity} x ${item.title}`).join(', ')}</Typography><Typography sx={{ my: 1 }}>Demo status: {tracking.label}</Typography>{tracking.index < DEMO_TRACKING_STAGES.length - 1 && <Button startIcon={<LocalShippingOutlinedIcon />} variant="outlined" onClick={() => handleAdvance(order, tracking.index + 1)}>Update to {DEMO_TRACKING_STAGES[tracking.index + 1]}</Button>}</Box>;
    })}
  </Box>;
}
