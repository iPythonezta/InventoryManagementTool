import { useState, useEffect, useCallback } from 'react';
import orderService from '../services/orderService';
import { toast } from 'react-toastify';

export function useOrders(token) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await orderService.getAll();
      setOrders(data);
    } catch {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return { orders, loading, refetch: fetchOrders };
}
