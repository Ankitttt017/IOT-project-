import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getPlants      = ()        => api.get('/plants');
export const getParts       = (params)  => api.get('/parts', { params });
export const getPartById    = (id)      => api.get(`/parts/${id}`);
export const updatePart     = (id, d)   => api.put(`/parts/${id}`, d);
export const getOperations  = (id)      => api.get(`/parts/${id}/operations`);
export const getSheets      = (id)      => api.get(`/parts/${id}/sheets`);
export const uploadSheet    = (id, type, d) => api.post(`/parts/${id}/sheets/${type}`, d);
export const getConfig      = (id)      => api.get(`/parts/${id}/configuration`);
export const updateConfig   = (id, d)   => api.put(`/parts/${id}/configuration`, d);
export const getStats       = (params)  => api.get('/stats', { params });

export default api;
