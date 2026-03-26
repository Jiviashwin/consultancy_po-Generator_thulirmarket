import axios from 'axios';

// Smart URL selection:
// - Browser on Mac (localhost) → always use localhost:5002
// - iPhone / Capacitor (non-localhost) → use VITE_API_URL from .env
const isLocalBrowser = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const BASE_URL = isLocalBrowser
    ? 'http://localhost:5002/api'
    : (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5002/api`);


// Create axios instance with base configuration
const api = axios.create({
    baseURL: BASE_URL
});

// Add request interceptor — attach JWT token if present
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method.toUpperCase(), config.url, config.data);
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('API Response:', response.status, response.data);
        return response;
    },
    error => {
        console.error('Response error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);


// Authentication API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getCurrentUser: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
};

// Vendors API
export const vendorsAPI = {
    getAll: () => api.get('/vendors'),
    getById: (id) => api.get(`/vendors/${id}`),
    create: (data) => api.post('/vendors', data),
    update: (id, data) => api.put(`/vendors/${id}`, data),
    delete: (id) => api.delete(`/vendors/${id}`)
};

// Products API
export const productsAPI = {
    getAll: () => api.get('/products'),
    getLowStock: () => api.get('/products/low-stock'),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
};

// Purchase Orders API
export const purchaseOrdersAPI = {
    generate: () => api.post('/purchase-orders/generate'),
    generateCustom: (items) => api.post('/purchase-orders/custom', { items }),
    getAll: (status) => api.get('/purchase-orders', { params: { status } }),
    getById: (id) => api.get(`/purchase-orders/${id}`),
    update: (id, data) => api.put(`/purchase-orders/${id}`, data),
    send: (id, deliveryMethod) => api.post(`/purchase-orders/${id}/send`, { deliveryMethod }),
    getPDF: (id) => `${BASE_URL}/purchase-orders/${id}/pdf`,
    delete: (id) => api.delete(`/purchase-orders/${id}`)
};

// Billing API
export const billingAPI = {
    create: (data) => api.post('/billing', data),
    getAll: () => api.get('/billing'),
    getById: (id) => api.get(`/billing/${id}`),
    getAnalytics: (range) => api.get(`/billing/analytics?range=${range}`),
    getStockLevels: () => api.get('/billing/stock-levels')
};

// Payment API
export const paymentAPI = {
    createOrder: (data) => api.post('/payment/create-order', data),
    verifyPayment: (data) => api.post('/payment/verify', data)
};

export default api;
