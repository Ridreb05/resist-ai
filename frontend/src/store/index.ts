// File: frontend/src/store/index.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  username: string
  full_name?: string
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'resistai-auth' }
  )
)

export interface PredictionResult {
  prediction_id: string
  bacterial_species: string
  antibiotic: string
  prediction: 'Resistant' | 'Susceptible' | 'Intermediate'
  confidence: number
  probability_resistant: number
  probability_susceptible: number
  probability_intermediate: number
  feature_importance: Array<{ feature: string; shap_value: number; direction: string }>
  treatment_suggestions: Array<{
    antibiotic: string
    recommendation: string
    confidence: number
    rationale: string
  }>
  model_version: string
  created_at: string
}

interface PredictionState {
  results: PredictionResult[]
  loading: boolean
  error: string | null
  addResult: (r: PredictionResult) => void
  clearResults: () => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
}

export const usePredictionStore = create<PredictionState>()((set) => ({
  results: [],
  loading: false,
  error: null,
  addResult: (r) => set((s) => ({ results: [r, ...s.results].slice(0, 50) })),
  clearResults: () => set({ results: [] }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
