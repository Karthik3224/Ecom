import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {
  getNotificationsByOrder,
  isNotificationServiceUnavailable,
  normalizeNotification,
  sendNotification,
} from '../../services/notificationApi';
import { notificationStore, subscribeToLocalData } from '../../services/localDataService';
import './NotificationHistoryPanel.css';

const statusColor = {
  PENDING: 'warning',
  SENT: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

const formatDate = (value) => {
  if (!value) return 'Not sent yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const localNotificationsFor = (orderId) => notificationStore.list().filter((item) => item.orderId === orderId).map((item) => normalizeNotification({
  ...item,
  subject: item.subject || item.title,
  notificationType: item.notificationType || item.type || 'ORDER_STATUS_UPDATED',
  channel: item.channel || 'PUSH',
  status: item.status || 'SENT',
  sentAt: item.sentAt || item.createdAt,
}));

const fallbackNotificationFor = (order) => {
  if (!order?.id || !order?.status) return null;
  return normalizeNotification({
    id: `order-status-${order.id}-${order.status}`,
    orderId: order.id,
    customerId: order.customerId || order.customer?.id || '',
    notificationType: order.status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_UPDATED',
    channel: 'PUSH',
    subject: `Order ${order.status}`,
    message: `Your order ${order.orderNumber || order.id} is now ${String(order.status).toLowerCase()}.`,
    status: 'SENT',
    sentAt: order.updatedAt || order.createdAt,
    createdAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  });
};

const NotificationHistoryPanel = ({ orderId, order }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState('');
  const [error, setError] = useState('');

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [notifications]
  );

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const response = await getNotificationsByOrder(orderId, 0, 20);
      const backend = (response?.content || []).map(normalizeNotification);
      const local = localNotificationsFor(orderId);
      const fallback = fallbackNotificationFor(order);
      setNotifications([...(fallback ? [fallback] : []), ...local, ...backend].filter((item, index, items) => items.findIndex((entry) => entry.id === item.id) === index));
    } catch (apiError) {
      const local = localNotificationsFor(orderId);
      const fallback = fallbackNotificationFor(order);
      const next = [...(fallback ? [fallback] : []), ...local];
      setNotifications(next);
      setError(next.length ? '' : isNotificationServiceUnavailable(apiError) ? 'Notification Service is unavailable.' : apiError.message);
    } finally {
      setLoading(false);
    }
  }, [order, orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 10000);
    const unsubscribe = subscribeToLocalData(({ key }) => {
      if (!key || key === 'notifications') load();
    });
    return () => {
      window.clearInterval(poll);
      unsubscribe();
    };
  }, [load]);

  const handleSend = async (notificationId) => {
    setSendingId(notificationId);
    setError('');
    try {
      const updated = normalizeNotification(await sendNotification(notificationId));
      setNotifications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSendingId('');
    }
  };

  return (
    <Box className="notification-history-card">
      <Box className="notification-history-header">
        <Box className="notification-history-title">
          <NotificationsNoneOutlinedIcon />
          <Typography>Notifications</Typography>
        </Box>
        <Button size="small" startIcon={<RefreshIcon />} disabled={loading || !orderId} onClick={load}>Refresh</Button>
      </Box>

      {loading && <Box className="notification-loading"><CircularProgress size={18} /><Typography>Loading notifications...</Typography></Box>}
      {error && <Typography className="notification-error" role="alert">{error}</Typography>}
      {!loading && !error && !sortedNotifications.length && <Typography className="notification-empty">No notifications found for this order.</Typography>}

      <Box className="notification-list">
        {sortedNotifications.map((notification) => (
          <Box className="notification-row" key={notification.id}>
            <Box className="notification-row-main">
              <Box className="notification-row-top">
                <Typography className="notification-subject">{notification.subject}</Typography>
                <Chip size="small" color={statusColor[notification.status] || 'default'} label={notification.status} />
              </Box>
              <Typography className="notification-message">{notification.message}</Typography>
              <Typography className="notification-meta">{notification.channel} {notification.recipient ? `to ${notification.recipient}` : 'to customer'} - {formatDate(notification.sentAt || notification.createdAt)}</Typography>
            </Box>
            {notification.status === 'PENDING' && (
              <Button
                size="small"
                variant="outlined"
                startIcon={sendingId === notification.id ? <CircularProgress size={14} /> : <SendOutlinedIcon />}
                disabled={Boolean(sendingId)}
                onClick={() => handleSend(notification.id)}
              >
                Send
              </Button>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default NotificationHistoryPanel;
