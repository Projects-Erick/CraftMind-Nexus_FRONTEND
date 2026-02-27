import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Evita loop: só redireciona se não estiver já no /login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('cm_token');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    } else if (err.response?.status >= 500) {
      toast.error('Erro no servidor. Tente novamente.');
    } else if (!err.response) {
      // Erro de rede (backend offline) — não trava o app
      console.warn('Backend inacessível:', err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
