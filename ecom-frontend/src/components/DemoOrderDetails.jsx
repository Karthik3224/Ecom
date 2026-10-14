import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DemoDeliveryTracking from './DemoDeliveryTracking';

export default function DemoOrderDetails({ order, checkout, formatCurrency, onClose }) {
  const subtotal = order?.items.reduce((sum, item) => sum + Math.round(Number(item.price) * 100) * Number(item.quantity), 0) / 100 || 0;
  const delivery = Number(order?.delivery || 0);
  const handling = order ? (Math.round(order.total * 100) - Math.round(subtotal * 100) - Math.round(delivery * 100)) / 100 : 0;
  return <Dialog open={Boolean(order)} onClose={onClose} fullScreen>
    <DialogTitle sx={{ pr: 7, bgcolor: '#075f40', color: 'white' }}>Demo Order Details<IconButton aria-label="Close order details" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}><CloseIcon /></IconButton></DialogTitle>
    {order && <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
      <Alert severity="info">Simulated order only. No payment was collected and no delivery is booked.</Alert>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1.2fr) minmax(0,1fr)' }, gap: { xs: 2, md: 5 }, mt: 2 }}>
      <Box sx={{ minWidth: 0, order: { xs: 2, md: 2 } }}>
      <Typography variant="h6" sx={{ mt: 2 }}>{order.storeName || order.storeId}</Typography>
      <Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}>{order.id}</Typography>
      {order.paymentId && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Demo payment reference: {order.paymentId}</Typography>}
      <Typography sx={{ my: 1 }}>{new Date(checkout.createdAt).toLocaleString()}</Typography>
      <Typography fontWeight={700}>Your items</Typography>
      {order.items.map((item, index) => <Box key={`${item.productId}:${item.variantId}:${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
        {(item.image || item.imageUrl) && <Box component="img" src={item.image || item.imageUrl} alt={item.title || 'Product'} sx={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />}
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ overflowWrap: 'anywhere' }}>{item.title || item.productName}</Typography><Typography variant="body2" color="text.secondary">{item.weight} | Quantity: {item.quantity}</Typography></Box>
        <Typography>{formatCurrency(Math.round(Number(item.price) * 100) * Number(item.quantity) / 100)}</Typography>
      </Box>)}
      <Typography fontWeight={700} sx={{ mt: 2 }}>Delivery address</Typography>
      <Typography sx={{ overflowWrap: 'anywhere' }}>{checkout.address || 'No delivery address recorded'}</Typography>
      <Typography>Payment option: {checkout.method} (simulation)</Typography>
      <Box sx={{ my: 2 }}>
        {[['Items', subtotal], ['Delivery', delivery], ['Handling', handling], ['Total', order.total]].map(([label, amount]) => <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: .5 }}><Typography fontWeight={label === 'Total' ? 700 : 400}>{label}</Typography><Typography>{formatCurrency(amount)}</Typography></Box>)}
      </Box>
      <Button variant="outlined" fullWidth onClick={onClose}>Close Details</Button>
      </Box>
      <Box sx={{ minWidth: 0, order: 1 }}><DemoDeliveryTracking key={order.id} order={order} customerId={checkout.customerId} createdAt={checkout.createdAt} destination={checkout.destination} address={checkout.address} /></Box>
      </Box>
    </DialogContent>}
  </Dialog>;
}
