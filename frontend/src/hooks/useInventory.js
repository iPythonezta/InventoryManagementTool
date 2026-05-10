import { useState, useEffect, useCallback } from 'react';
import inventoryService from '../services/inventoryService';
import { toast } from 'react-toastify';

export function useInventory(token) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await inventoryService.getAll();
      setInventory(data);
    } catch {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  return { inventory, loading, refetch: fetchInventory };
}
