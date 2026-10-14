import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { receiptRows, verifiedPaymentLabel } from '../utils/orderReceipt';
import { downloadInvoicePdf } from '../utils/invoicePdf';

const paymentMethodLabel = (method = '') => ({
  DEMO_UPI: 'UPI',
  DEMO_CARD: 'Card',
  DEMO_COD: 'Cash on Delivery',
})[method] || method;

export default function OrderDocuments({ order, payment, formatCurrency }) {
  const [view, setView] = useState(null);
  return <>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      <Button variant="outlined" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => setView('Receipt')}>View Receipt</Button>
      <Button variant="outlined" startIcon={<DescriptionOutlinedIcon />} onClick={() => setView('Invoice')}>View Invoice</Button>
    </Box>
    <Dialog open={Boolean(view)} onClose={() => setView(null)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 7 }}>{view}<IconButton aria-label="Close document" onClick={() => setView(null)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton></DialogTitle>
      <DialogContent>
        <Typography variant="h6" fontWeight={700}>Spices and Pickles</Typography>
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere', mb: 2 }}>Order {order.id}</Typography>
        {view === 'Invoice' ? <>
          <Alert severity="info" sx={{ mb: 2 }}>Order invoice. Not a tax invoice or proof of payment.</Alert>
          <Typography sx={{ mb: 1 }}>Order status: {order.status || 'CREATED'}</Typography>
          <Typography sx={{ mb: 2 }}>{verifiedPaymentLabel(payment)}</Typography>
          {(order.items || []).map((item, index) => <Box key={item.id || index} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}><Typography>{item.quantity} x {item.title}</Typography><Typography>{formatCurrency(item.totalPrice)}</Typography></Box>)}
          {receiptRows(order).map((row) => <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}><Typography>{row.label}</Typography><Typography>{formatCurrency(row.amount)}</Typography></Box>)}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, borderTop: '1px solid #e2e8f0', py: 2, mt: 1 }}><Typography fontWeight={800}>Order total</Typography><Typography fontWeight={800}>{formatCurrency(order.totalAmount)}</Typography></Box>
          <Button variant="contained" fullWidth onClick={() => downloadInvoicePdf(order, payment)}>Download Invoice PDF</Button>
        </> : <>
          {order.createdAt && <Typography>{new Date(order.createdAt).toLocaleString()}</Typography>}
          <Typography sx={{ my: 2 }}>{verifiedPaymentLabel(payment)}</Typography>
          {(order.items || []).map((item, index) => <Box key={item.id || index} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
            <Typography>{item.quantity} x {item.title}</Typography><Typography>{formatCurrency(item.totalPrice)}</Typography>
          </Box>)}
          {receiptRows(order).map((row) => <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}><Typography>{row.label}</Typography><Typography>{formatCurrency(row.amount)}</Typography></Box>)}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, borderTop: '1px solid #e2e8f0', py: 2 }}><Typography fontWeight={800}>Order total</Typography><Typography fontWeight={800}>{formatCurrency(order.totalAmount)}</Typography></Box>
          {payment?.paymentMethod && <Typography>Payment method: {paymentMethodLabel(payment.paymentMethod)}</Typography>}
          <Typography variant="caption" color="text.secondary">Order summary. Not a tax invoice or proof of payment.</Typography>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}
