import api from './api';

const stockAlertService = {
  getAll: () => api.get('/api/stock-alert/'),
  create: (productIds, threshold) =>
    api.post('/api/stock-alert/', {
      threshold,
      product_ids: JSON.stringify(productIds),
    }),
  remove: (stockId) => api.delete('/api/stock-alert/', { data: { stock_id: stockId } }),
};

export default stockAlertService;
