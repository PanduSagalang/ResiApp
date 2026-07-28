import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (jika perlu token di masa depan)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Toko endpoints
export const toko = {
  getAll: () => api.get('/toko'),
  getById: (id) => api.get(`/toko/${id}`),
  create: (data) => api.post('/toko', data),
  update: (id, data) => api.put(`/toko/${id}`, data),
  delete: (id) => api.delete(`/toko/${id}`),
};

// Upload endpoints
export const upload = {
  send: (tokoId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/${tokoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Produk endpoints
export const produk = {
  getAll: (tokoId, search) => {
    const params = search ? { search } : {};
    return api.get(`/produk/${tokoId}`, { params });
  },
  create: (tokoId, data) => api.post(`/produk/${tokoId}`, data),
  update: (id, data) => api.put(`/produk/${id}`, data),
  delete: (id) => api.delete(`/produk/${id}`),
};

// Resi endpoints
export const resi = {
  getAll: (tokoId, params) => api.get(`/resi/${tokoId}`, { params }),
  update: (id, data) => api.put(`/resi/${id}`, data),
  delete: (id) => api.delete(`/resi/${id}`),
  retur: (id, data) => api.post(`/resi/${id}/retur`, data),
};

// Laporan endpoints
export const laporan = {
  getAll: (tokoId, params) => api.get(`/laporan/${tokoId}`, { params }),
  exportCSV: (tokoId, params) => {
    return api.get(`/laporan/${tokoId}/export`, { 
      params,
      responseType: 'blob' 
    });
  },
};

// Nota endpoints
export const nota = {
  get: (resiId) => api.get(`/nota/resi/${resiId}`),
  bulanan: (tokoId, params) => api.get(`/nota/toko/${tokoId}/bulanan`, { params }),
};

export default api;
