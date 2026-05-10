import api from './api';

const orderService = {
  getAll: () => api.get('/api/order/'),
  getById: (id) => api.get(`/api/order/${id}/`),
  create: (customerName, customerPhone, orderItems) =>
    api.post('/api/order/', {
      customer_name: customerName,
      customer_phone: customerPhone,
      order_items: JSON.stringify(orderItems),
    }),
  remove: (orderId) => api.delete('/api/order/', { data: { orderId } }),
};

export default orderService;
