import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { getPaymentByOrder } from '../services/paymentApi';
import { verifyPersistedPayment } from '../utils/persistedPayment';

export default function PersistedPaymentReference({ orderId, customerId, total, showStatus = true }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const scope = `${orderId}:${customerId}:${total}:${retry}`;
  useEffect(() => {
    let active = true;
    let timer;
    let attempts = 0;
    const load = async () => {
      try {
        const result = verifyPersistedPayment(await getPaymentByOrder(orderId), orderId, customerId, total);
        if (active) setRecord({ scope, payment: result });
      } catch (reason) {
        if (!active) return;
        if (Number(reason.status) === 404 && ++attempts < 15) timer = setTimeout(load, 2000);
        else setError({ scope, message: Number(reason.status) === 404 ? 'Payment record is awaiting service synchronization.' : reason.message });
      }
    };
    if (orderId && customerId) load();
    return () => { active = false; clearTimeout(timer); };
  }, [orderId, customerId, total, scope]);
  return <Box sx={{ py: 1, minWidth: 0 }} aria-live="polite">
    {record?.scope === scope ? <>
      <Typography sx={{ overflowWrap: 'anywhere' }}>Payment UID: {record.payment.id}</Typography>
      {showStatus && <Typography>Payment status: {record.payment.status}</Typography>}
    </> : error?.scope === scope ? <><Typography role="alert">{error.message}</Typography><Button onClick={() => setRetry(value => value + 1)}>Refresh Payment Record</Button></>
      : <Typography>Waiting for the saved payment record...</Typography>}
  </Box>;
}
