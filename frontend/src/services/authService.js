import api from './api';

const authService = {
  login: (email, password) => api.post('/auth/token/login', { email, password }),
  logout: () => api.post('/auth/token/logout'),
  me: () => api.get('/auth/users/me/'),
};

export default authService;
