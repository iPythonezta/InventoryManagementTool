import api from './api';

const statsService = {
  getSales: () => api.get('/api/sales/'),
};

export default statsService;
