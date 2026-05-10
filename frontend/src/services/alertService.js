import api from './api';

const alertService = {
  getAll: () => api.get('/api/user/alerts/'),
  markSeen: (id, seen) => api.put('/api/user/alerts/', { id, seen }),
  remove: (id) => api.delete('/api/user/alerts/', { data: { id } }),
};

export default alertService;
