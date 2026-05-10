import { useState, useEffect, useCallback } from 'react';
import alertService from '../services/alertService';

export function useAlerts(token) {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await alertService.getAll();
      setAlerts(data);
    } catch {}
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  return { alerts, setAlerts, refetch: fetchAlerts };
}
