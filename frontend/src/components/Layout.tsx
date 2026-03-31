// File: frontend/src/components/Layout.tsx
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Activity, Microscope, Dna, BarChart3, Home, LogOut, Menu, X, ShieldAlert, User, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',         icon: Home,        label: 'Overview'     },
  { to: '/predict',  icon: Microscope,  label: 'Predict'      },
  { to: '/genes',    icon: Dna,         label: 'Gene Network' },
  { to: '/analysis', icon: BarChart3,   label: 'Analysis'     },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--accent)', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ShieldAlert size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>ResistAI</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 0 }}>v1.0 · Codecure 2026</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 8px 8px' }}>
          Navigation
        </div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 'var(--r-md)',
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-overlay)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--border-strong)' : 'transparent'}`,
              transition: 'all var(--t-fast)', textDecoration: 'none',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget
              if (!el.style.background || el.style.background === 'transparent') {
                el.style.background = 'var(--bg-elevated)'
                el.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              if (el.getAttribute('aria-current') !== 'page') {
                el.style.background = 'transparent'
                el.style.color = 'var(--text-secondary)'
              }
            }}
          >
            <Icon size={15} style={{ flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {user ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 8px', borderRadius: 'var(--r-md)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-accent)' }}>
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{user.username}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }} className="truncate">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: 'var(--text-muted)', borderRadius: 'var(--r-sm)', display: 'flex',
                transition: 'color var(--t-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--resistant)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: '7px 10px',
              background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 'var(--r-md)', color: 'var(--text-accent)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all var(--t-fast)',
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        className="desktop-only"
        style={{
          width: 'var(--sidebar-w)',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          position: 'sticky', top: 0, height: '100vh',
          flexShrink: 0, zIndex: 30,
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: top bar ── */}
      <div
        className="mobile-only"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: 'var(--topbar-h)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={13} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>ResistAI</span>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          />
          <div
            className="slide-in"
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
              background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
              zIndex: 50, display: 'flex', flexDirection: 'column',
            }}
          >
            <SidebarContent />
          </div>
        </>
      )}

      {/* ── Main content ── */}
      <main style={{
        flex: 1, minWidth: 0, overflow: 'auto',
        paddingTop: 0,
      }}>
        {/* Mobile top-bar spacer */}
        <div className="mobile-only" style={{ height: 'var(--topbar-h)' }} />
        <Outlet />
      </main>
    </div>
  )
}
