// File: frontend/src/pages/Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, LogIn, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../utils/api'
import { useAuthStore } from '../store'
import { Input, Button } from '../components/ui'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email:'', password:'', username:'', full_name:'' })

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res: any = mode === 'login'
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register({ email: form.email, password: form.password, username: form.username, full_name: form.full_name })
      setAuth(res.data.access_token, res.data.user)
      toast.success(`Welcome, ${res.data.user.username}!`)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--sp-6)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 350, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)',
      }}/>

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--accent)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 8px 24px rgba(59,130,246,0.2)',
          }}>
            <ShieldAlert size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>ResistAI</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: 'var(--sp-6)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Mode tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)',
            padding: 3, marginBottom: 24, border: '1px solid var(--border)',
          }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: 'none',
                background: mode === m ? 'var(--bg-overlay)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: mode === m ? 500 : 400,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all var(--t-fast)',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && <>
              <Input label="Full Name" type="text" placeholder="Dr. Jane Smith" value={form.full_name} onChange={update('full_name')} autoComplete="name" />
              <Input label="Username" type="text" placeholder="drjsmith" required value={form.username} onChange={update('username')} autoComplete="username" />
            </>}
            <Input label="Email" type="email" placeholder="you@hospital.org" required value={form.email} onChange={update('email')} autoComplete="email" />
            <Input label="Password" type="password" placeholder="••••••••" required value={form.password} onChange={update('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

            <Button type="submit" loading={loading} disabled={loading} fullWidth style={{ marginTop: 4 }}>
              {mode === 'login' ? <LogIn size={14}/> : <UserPlus size={14}/>}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div style={{
            marginTop: 20, padding: '10px 12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>No account?</span>{' '}
            Predictions work without signing in.{' '}
            <button onClick={() => navigate('/')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-accent)', fontSize: 12, padding: 0,
              fontFamily: 'var(--font-sans)', textDecoration: 'underline',
            }}>Browse as guest →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
