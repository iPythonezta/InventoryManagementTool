import { useState, useEffect } from 'react';
import statsService from '../services/statsService';
import { toast } from 'react-toastify';

export function useStats(token, isAuthorized) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !isAuthorized) return;
    setLoading(true);
    statsService.getSales()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to fetch statistics'))
      .finally(() => setLoading(false));
  }, [token, isAuthorized]);

  return { stats, loading };
}
