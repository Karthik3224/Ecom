import { useEffect, useState } from 'react';
import { Alert, Box, Chip, LinearProgress, Snackbar, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { DEMO_TRACKING_STAGES, readManagedDemoTracking } from '../utils/demoTracking';
import DemoTrackingMap from './DemoTrackingMap';
import { collectionStore } from '../services/localDataService';

export default function DemoDeliveryTracking({ order, customerId, createdAt, destination, address }) {
  const [snapshot, setSnapshot] = useState(() => readManagedDemoTracking(localStorage, customerId, order, createdAt));
  const [notification, setNotification] = useState('');
  useEffect(() => {
    let lastIndex = readManagedDemoTracking(localStorage, customerId, order, createdAt).index;
    const refresh = () => {
      const next = readManagedDemoTracking(localStorage, customerId, order, createdAt);
      if (next.index > lastIndex) {
        setNotification(`Demo update: ${order.storeName || order.storeId} - ${next.label}`);
        setSnapshot(next);
        lastIndex = next.index;
      }
    };
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('storage', refresh);
    window.addEventListener('demo-tracking-updated', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('storage', refresh); window.removeEventListener('demo-tracking-updated', refresh); };
  }, [customerId, order, createdAt]);
  const store = collectionStore.list('stores').find((entry) => entry.id === order.storeId);
  return <Box sx={{ py: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocalShippingOutlinedIcon color="success" /><Typography fontWeight={700}>Demo Delivery Tracking</Typography></Box>
    <DemoTrackingMap store={store} destination={destination} />
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 2 }}><Typography variant="h5" fontWeight={700} role="status">{snapshot.label}</Typography><Chip label="Demo order" color="success" variant="outlined" /></Box>
    <LinearProgress aria-label="Demo delivery progress" variant="determinate" value={snapshot.index / (DEMO_TRACKING_STAGES.length - 1) * 100} sx={{ height: 8, borderRadius: 1, my: 2, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#087451' } }} />
    <Typography sx={{ mb: 2 }}>Arrival estimate: not available</Typography>
    <Typography fontWeight={700}>Deliver to</Typography><Typography sx={{ mb: 2, overflowWrap: 'anywhere' }}>{address || 'Address not recorded'}</Typography>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 2, borderTop: '1px solid #e2e8f0' }}>
      {(order.items[0]?.image || order.items[0]?.imageUrl) && <Box component="img" src={order.items[0].image || order.items[0].imageUrl} alt="Ordered product" sx={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 }} />}
      <Box sx={{ minWidth: 0 }}><Typography fontWeight={700}>Order received by {order.storeName || order.storeId}</Typography><Typography color="text.secondary">Delivery partner: not assigned</Typography></Box>
    </Box>
    <Typography variant="caption" color="text.secondary">Demo updates are controlled by the assigned store manager. No real courier, SMS or email is involved.</Typography>
    {DEMO_TRACKING_STAGES.map((label, index) => <Box key={label} sx={{ borderLeft: '2px solid', borderColor: index <= snapshot.index ? '#087451' : '#e2e8f0', pl: 2, py: 1 }}><Typography fontWeight={index === snapshot.index ? 700 : 400} color={index <= snapshot.index ? 'text.primary' : 'text.secondary'}>{label}{index > snapshot.index ? ' (upcoming)' : ''}</Typography>{snapshot.events[index] && <Typography variant="caption">{new Date(snapshot.events[index].time).toLocaleTimeString()} | Demo event</Typography>}</Box>)}
    <Typography fontWeight={700} sx={{ mt: 2 }}>Demo Notifications</Typography>
    {snapshot.events.map((event) => <Typography key={event.label} variant="body2" sx={{ mt: 1 }}>{new Date(event.time).toLocaleTimeString()} - {order.storeName || order.storeId}: {event.label} (simulated)</Typography>)}
    <Snackbar open={Boolean(notification)} autoHideDuration={6000} onClose={() => setNotification('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity="info" onClose={() => setNotification('')}>{notification}</Alert></Snackbar>
  </Box>;
}
