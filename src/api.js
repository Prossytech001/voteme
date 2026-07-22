import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE });

// ---- Public endpoints ----
export const getCategories = () => api.get('/categories').then(r => r.data);
export const getNominees = (categoryId) => api.get(`/nominees/category/${categoryId}`).then(r => r.data);
export const getPricePerVote = () => api.get('/settings/price-per-vote').then(r => r.data);
export const initiateVote = (payload) => api.post('/votes/initiate', payload).then(r => r.data);
export const verifyPayment = (reference) => api.get(`/votes/verify/${reference}`).then(r => r.data);

// ---- Admin endpoints (require x-admin-key header) ----
const adminHeaders = (adminKey) => ({ headers: { 'x-admin-key': adminKey } });

export const adminCreateCategory = (adminKey, name) =>
  api.post('/categories', { name }, adminHeaders(adminKey)).then(r => r.data);

export const adminUpdateCategory = (adminKey, id, payload) =>
  api.patch(`/categories/${id}`, payload, adminHeaders(adminKey)).then(r => r.data);

export const adminDeleteCategory = (adminKey, id) =>
  api.delete(`/categories/${id}`, adminHeaders(adminKey)).then(r => r.data);

export const adminCreateNominee = (adminKey, payload) =>
  api.post('/nominees', payload, adminHeaders(adminKey)).then(r => r.data);

export const adminUpdateNominee = (adminKey, id, payload) =>
  api.patch(`/nominees/${id}`, payload, adminHeaders(adminKey)).then(r => r.data);

export const adminDeleteNominee = (adminKey, id) =>
  api.delete(`/nominees/${id}`, adminHeaders(adminKey)).then(r => r.data);

export const adminUpdatePrice = (adminKey, priceNaira) =>
  api.patch('/settings/price-per-vote', { price_naira: priceNaira }, adminHeaders(adminKey)).then(r => r.data);

export const adminGetAllVotes = (adminKey) =>
  api.get('/votes/admin/all', adminHeaders(adminKey)).then(r => r.data);

export const adminReconcilePending = (adminKey) =>
  api.post('/votes/admin/reconcile-pending', {}, adminHeaders(adminKey)).then(r => r.data);

export default api;
