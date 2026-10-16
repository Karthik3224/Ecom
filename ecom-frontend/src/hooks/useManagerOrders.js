import { useEffect, useState } from 'react';
import { getOrders, normalizeOrder } from '../services/orderApi';
import { loadManagerOrders } from '../utils/managerOrders.js';

export function useManagerOrders(storeId, userId) {
  const [result, setResult] = useState({ orders: [], error: '', loading: true });
  useEffect(() => {
    let active = true;
    let busy = false;
    const load = async () => {
      if (busy) return;
      busy = true;
      try {
        const orders = await loadManagerOrders(storeId, getOrders);
        if (active) setResult({ storeId, userId, orders: orders.map(normalizeOrder), error: '', loading: false });
      } catch (error) {
        if (active) setResult({ storeId, userId, orders: [], error: error.message, loading: false });
      } finally { busy = false; }
    };
    load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener('focus', load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', load); };
  }, [storeId, userId]);
  return result.storeId === storeId && result.userId === userId ? result : { orders: [], error: '', loading: true };
}
