// File: frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Microscope, Dna, BarChart3, Shield, ArrowRight, TrendingUp, Activity } from 'lucide-react'
import { predictionApi } from '../utils/api'
import { Card, StatCard, PageWrapper, Button } from '../components/ui'

interface ModelInfo {
  model_type: string; training_samples: number; cv_f1_macro: number
  roc_auc_macro: number; features_used: number; antibiotics_covered: number
}

const FEATURES = [
  { icon: Microscope, color: 'var(--accent)', label: 'Real-time Prediction',
    desc: 'XGBoost + LightGBM ensemble with SHAP explainability. Predicts resistance with per-feature attribution.',
    to: '/predict' },
  { icon: Dna, color: 'var(--susceptible)', label: 'Gene Network',
    desc: 'Interactive resistance gene co-occurrence network built with NetworkX. Explore community structures.',
    to: '/genes' },
  { icon: BarChart3, color: 'var(--intermediate)', label: 'Resistance Analytics',
    desc: 'Dataset-level resistance rates per antibiotic, radar charts, and multi-drug resistance pattern analysis.',
    to: '/analysis' },
  { icon: Shield, color: 'var(--resistant)', label: 'Treatment Support',
    desc: 'Evidence-based alternative antibiotic suggestions when resistance is predicted. First-line to last-resort.',
    to: '/predict' },
]

const STACK = ['FastAPI','XGBoost','LightGBM','SHAP','NetworkX','scikit-learn','React','TypeScript','PostgreSQL','Docker']

export default function Dashboard() {
  const navigate = useNavigate()
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    predictionApi.modelInfo()
      .then(r => setModelInfo(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      {/* ── Hero ── */}
      <div style={{ paddingTop: 'var(--sp-4)', paddingBottom: 'var(--sp-10)', maxWidth: 680 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
          padding: '3px 10px', borderRadius: 'var(--r-full)',
          background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.25)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--susceptible)', display: 'inline-block' }}/>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-accent)' }}>
            SPIRIT 2026 · IIT (BHU) Varanasi · Codecure
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
          Antibiotic Resistance<br />
          <span style={{ color: 'var(--accent)' }}>Intelligence Platform</span>
        </h1>

        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24, maxWidth: 520 }}>
          AI-driven prediction of antimicrobial resistance patterns from bacterial genetic and
          phenotypic data — supporting evidence-based antibiotic stewardship.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/predict')} size="lg">
            <Microscope size={15} /> Run Prediction <ArrowRight size={13} />
          </Button>
          <Button variant="outline" onClick={() => navigate('/genes')} size="lg">
            <Dna size={15} /> Gene Network
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 40 }}>
        <StatCard loading={loading} label="Model F1 Score"   value={modelInfo ? `${(modelInfo.cv_f1_macro*100).toFixed(1)}%`   : undefined} sub="Cross-validated macro"    accent="var(--susceptible)" />
        <StatCard loading={loading} label="ROC-AUC"          value={modelInfo ? `${(modelInfo.roc_auc_macro*100).toFixed(1)}%`  : undefined} sub="Multi-class OvR"         accent="var(--accent)"      />
        <StatCard loading={loading} label="Training Isolates" value={modelInfo ? modelInfo.training_samples.toLocaleString()    : undefined} sub="Bacterial records"                                    />
        <StatCard loading={loading} label="Antibiotics"       value={modelInfo ? modelInfo.antibiotics_covered                  : undefined} sub="Covered in model"        accent="var(--intermediate)" />
        <StatCard loading={loading} label="Features"          value={modelInfo ? modelInfo.features_used                        : undefined} sub="MIC + Zone + Genes"                                   />
      </div>

      {/* ── Features grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px),1fr))', gap: 16, marginBottom: 40 }}>
        {FEATURES.map(({ icon: Icon, color, label, desc, to }) => (
          <Card
            key={label}
            onClick={() => navigate(to)}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color var(--t-fast)' }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--r-md)',
              background: `${color}18`, border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={17} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color }}>
              Open <ArrowRight size={11} />
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tech stack ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Tech Stack
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STACK.map(t => (
            <span key={t} style={{
              padding: '3px 10px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-full)',
              fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            }}>{t}</span>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
