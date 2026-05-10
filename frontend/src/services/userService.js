import api from './api';

const userService = {
  getAll: () => api.get('/auth/users/'),
  create: (email, password, userType) => api.post('/auth/users/', { email, password, userType }),
  update: (email, username, userType) => api.put('/auth/users/', { email, username, userType }),
  remove: (email) => api.delete('/auth/users/', { data: { email } }),
};

export default userService;
