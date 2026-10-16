import { useState } from 'react';
import { Button, Typography } from '@mui/material';
import { requestNotificationAccess } from '../utils/notificationPermission.js';
const messages = {
  granted: 'Browser notification permission is granted. Your order updates remain available here.',
  denied: 'Notifications are blocked. Change site permissions in browser settings. Order updates remain available here.',
  default: 'Notification permission was not granted. Order updates remain available here.',
  unsupported: 'Browser notifications are unavailable here. Order updates remain available here.',
};
export default function NotificationPermission() {
  const [state, setState] = useState('');
  const [busy, setBusy] = useState(false);
  const request = async () => {
    if (busy) return;
    setBusy(true);
    try { setState(await requestNotificationAccess()); } finally { setBusy(false); }
  };
  return <><Button disabled={busy || Boolean(state)} onClick={request}>Check browser notification access</Button>{state && <Typography role="status" sx={{ mb: 2 }}>{messages[state] || messages.default}</Typography>}</>;
}
