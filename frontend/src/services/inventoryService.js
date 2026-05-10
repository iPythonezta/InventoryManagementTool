import api from './api';

const inventoryService = {
  getAll: () => api.get('/api/inventory/'),
  getByBarcode: (barcode) => api.get(`/api/inventory/${barcode}/`),
  create: (data) => api.post('/api/inventory/', data),
  update: (data) => api.put('/api/inventory/', data),
  remove: (barcode) => api.delete('/api/inventory/', { data: { barcode } }),
};

export default inventoryService;
