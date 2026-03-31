// File: frontend/src/utils/api.ts
import axios from 'axios'
import { useAuthStore } from '../store'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ─── Prediction ────────────────────────────────────────────────────────────────
export const predictionApi = {
  single: (data: {
    bacterial_species: string
    antibiotic: string
    features: Record<string, number>
  }) => api.post('/predict/single', data),

  batch: (isolates: Array<{ bacterial_species: string; antibiotic: string; features: Record<string, number> }>) =>
    api.post('/predict/batch', { isolates }),

  antibiotics: () => api.get<{ antibiotics: string[] }>('/predict/antibiotics'),
  modelInfo: () => api.get('/predict/model-info'),
}

// ─── Genes ─────────────────────────────────────────────────────────────────────
export const genesApi = {
  network: () => api.get('/genes/network'),
}

// ─── Analysis ──────────────────────────────────────────────────────────────────
export const analysisApi = {
  resistanceStats: () => api.get('/analysis/resistance-stats'),
  geneCommunities: () => api.get('/analysis/gene-communities'),
}
