import axios from 'axios';
import type { Target, Location, Probe, Incident } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: async (username: string, password: string) => {
    const response = await api.post('/api/v1/auth/login', { username, password });
    return response.data;
  },
};

export const targets = {
  list: async (activeOnly: boolean = false): Promise<Target[]> => {
    const response = await api.get(`/api/v1/targets?active_only=${activeOnly}`);
    return response.data;
  },
  create: async (target: { name: string; url: string; ip_address?: string; type?: string }) => {
    const response = await api.post('/api/v1/targets', target);
    return response.data;
  },
  update: async (targetId: number, target: Partial<Target>) => {
    const response = await api.put(`/api/v1/targets/${targetId}`, target);
    return response.data;
  },
  delete: async (targetId: number) => {
    const response = await api.delete(`/api/v1/targets/${targetId}`);
    return response.data;
  },
  getLive: async (targetId: number, window: number = 15) => {
    const response = await api.get(`/api/v1/targets/${targetId}/live?window=${window}`);
    return response.data;
  },
  getHistory: async (targetId: number, rangeDays: number = 7) => {
    const response = await api.get(`/api/v1/targets/${targetId}/history?range_days=${rangeDays}`);
    return response.data;
  },
};

export const locations = {
  list: async (): Promise<Location[]> => {
    const response = await api.get('/api/v1/locations');
    return response.data;
  },
};

export const probes = {
  list: async (): Promise<Probe[]> => {
    const response = await api.get('/api/v1/probes');
    return response.data;
  },
};

export const incidents = {
  list: async (status?: string, severity?: string): Promise<Incident[]> => {
    const params: any = {};
    if (status) params.status = status;
    if (severity) params.severity = severity;
    const response = await api.get('/api/v1/incidents', { params });
    return response.data;
  },
  acknowledge: async (incidentId: number, ackedBy: string) => {
    const response = await api.post(`/api/v1/incidents/${incidentId}/ack`, { acked_by: ackedBy });
    return response.data;
  },
};

export default api;
