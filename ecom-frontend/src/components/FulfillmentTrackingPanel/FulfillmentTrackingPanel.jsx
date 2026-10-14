import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import DemoTrackingMap from '../DemoTrackingMap';
import { customerDeliveryStatus } from '../../utils/fulfillmentStatus';

const FulfillmentTrackingPanel = ({ order, fulfillment, shipment, trackingEvents = [], loading = {}, errors = {}, refresh }) => {
  const deliveryStatus = customerDeliveryStatus({ fulfillment, shipment, order, trackingEvents });
  const isGlobal = order?.fulfillmentType === 'global' || order?.globalApproval === 'Pending' || order?.channel === '5-7 Days Delivery';
  const statusTone = ['Delivered', 'Cancelled', 'Failed', 'Returned'].includes(deliveryStatus) ? 'default' : 'success';
  const busy = Boolean(loading.fulfillment || loading.shipment);
  const error = errors.fulfillment || errors.shipment;

  return <Box component="section" aria-label="Order tracking status" sx={{ bgcolor: 'white', border: '1px solid #dfe8e3', borderRadius: 2, p: 2.5, display: 'grid', gap: 2 }}>
    {!isGlobal && <DemoTrackingMap demo={false} store={{ latitude: order?.storeLatitude, longitude: order?.storeLongitude, name: order?.sourceStore || 'Store' }} destination={{ latitude: order?.customerLatitude, longitude: order?.customerLongitude }} />}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShippingOutlinedIcon sx={{ color: '#075F40' }} />
        <Typography component="h2" variant="h6" fontWeight={800}>Order status</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {busy && <CircularProgress size={16} aria-label="Refreshing order status" />}
        <Chip label={deliveryStatus} color={statusTone} />
        {refresh && <Button size="small" variant="outlined" startIcon={<RefreshOutlinedIcon />} disabled={busy} onClick={refresh} sx={{ borderColor: '#d5e5dc', color: '#075F40', textTransform: 'none' }}>Refresh</Button>}
      </Box>
    </Box>
    {error && <Typography role="alert" color="error">{error}</Typography>}
  </Box>;
};

export default FulfillmentTrackingPanel;
