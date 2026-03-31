// File: frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import GeneNetwork from './pages/GeneNetwork'
import Analysis from './pages/Analysis'
import Login from './pages/Login'
import { useAuthStore } from './store'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--susceptible)', secondary: 'var(--bg-base)' } },
          error:   { iconTheme: { primary: 'var(--resistant)',   secondary: 'var(--bg-base)' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="predict" element={<Predict />} />
          <Route path="genes" element={<GeneNetwork />} />
          <Route path="analysis" element={<Analysis />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
