import axios from 'axios';


// Создаем экземпляр axios
const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Добавляем автоматическую вставку токена в заголовки
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок
let lastForbiddenPath = null;
api.interceptors.response.use(
  response => response,
  error => {
    const currentPath = window.location.pathname;

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } 
    else if (error.response?.status === 403) {
      if (lastForbiddenPath === currentPath) {
        return Promise.reject(error); 
      }

      lastForbiddenPath = currentPath; 

      if (currentPath !== '/login') {
        const errorMessage = error.response.data?.error?.message
          || error.response.data?.message
          || 'У вас нет надлежащих прав для получения доступа к данному ресурсу';

        alert(errorMessage);

        // Отложенное выполнение, чтобы избежать гонки
        setTimeout(() => {
          window.history.back();
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

// Профиль пользователя
export const userAPI = {
  getProf: () => api.get('/user/me'),
  updateProf: (data) => api.put('/user/me', data),
  getDocs: () => api.get('/user/me/documents'),
  getAllDocuments: () => api.get('/user/documents'),
  getAllUsers: () => api.get('/user/allusers'),
  getApplications: () => api.get('/user/applications'),
  postApplication: (description) => api.post('/user/applications', {description}),
  solveApplication: (app_id, number) => api.put('/user/applications', { app_id, number }),
  getUserProf: (user_id) => api.get('/user/userr', {params: { user_id }}),
  ban: (user_id, comment) => api.post('/user/userr/ban', { user_id, comment }),
  unban: (user_id) => api.post('/user/userr/unban', { user_id })
};

// Документы
export const documentsAPI = {
  upload: (file, type, description) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('type', type);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  download: (id) => api.get(`/documents/download/${id}`, { responseType: 'blob' }),
  info: (id) => api.get(`/documents/info/${id}`),
  delete: (id) => api.delete(`/documents/delete/${id}`)
};

// Авторизация
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password) => api.post('/auth/register', { username, password })
};

export default api;