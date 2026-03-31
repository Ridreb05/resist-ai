// File: frontend/src/pages/Predict.tsx
import { useState, useEffect } from 'react'
import { Microscope, FlaskConical, ChevronDown, ChevronUp, Pill, Info, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { predictionApi } from '../utils/api'
import { usePredictionStore, PredictionResult } from '../store'
import { Card, Badge, Button, Input, Select, Spinner, PageWrapper, SectionHeader, EmptyState, Divider } from '../components/ui'

const SPECIES = [
  'E. coli','S. aureus','K. pneumoniae','P. aeruginosa',
  'E. faecalis','E. faecium','A. baumannii','S. pneumoniae','H. influenzae','S. epidermidis',
]
const GENES = ['blaTEM','blaSHV','blaOXA','mecA','vanA','vanB','aac6','ermB','tetM','sul1']

function predColor(p: string) {
  if (p === 'Resistant') return 'var(--resistant)'
  if (p === 'Susceptible') return 'var(--susceptible)'
  return 'var(--intermediate)'
}
function predVariant(p: string): 'resistant'|'susceptible'|'intermediate' {
  if (p === 'Resistant') return 'resistant'
  if (p === 'Susceptible') return 'susceptible'
  return 'intermediate'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-strong)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      <p style={{ color:'var(--text-secondary)', marginBottom:2 }}>{label}</p>
      <p style={{ color:'var(--text-primary)', fontWeight:500 }}>{payload[0].value}%</p>
    </div>
  )
}

function ResultCard({ result }: { result: PredictionResult }) {
  const [expanded, setExpanded] = useState(true)
  const color = predColor(result.prediction)

  const probData = [
    { name:'Susceptible',  value:+(result.probability_susceptible*100).toFixed(1),  fill:'var(--susceptible)'  },
    { name:'Intermediate', value:+(result.probability_intermediate*100).toFixed(1), fill:'var(--intermediate)' },
    { name:'Resistant',    value:+(result.probability_resistant*100).toFixed(1),    fill:'var(--resistant)'    },
  ]

  const shapData = result.feature_importance.slice(0,8).map(f => ({
    name: f.feature.replace('MIC_','').replace('gene_','').replace('ZD_','ZD:'),
    value: +Math.abs(f.shap_value).toFixed(4),
    direction: f.direction,
  }))

  return (
    <Card style={{ border:`1px solid ${color}28` }}>
      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <Badge label={result.prediction} variant={predVariant(result.prediction)} dot />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
            {result.bacterial_species}
          </span>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>→</span>
          <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{result.antibiotic}</span>
          <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
            {(result.confidence*100).toFixed(1)}% confidence
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background:'none', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--text-muted)', padding:'3px 8px', display:'flex', alignItems:'center', gap:4, fontSize:11, fontFamily:'var(--font-sans)', flexShrink:0 }}
        >
          {expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Confidence bar */}
      <div style={{ height:3, background:'var(--bg-elevated)', borderRadius:'var(--r-full)', overflow:'hidden', marginBottom: expanded ? 20 : 0 }}>
        <div style={{ height:'100%', width:`${result.confidence*100}%`, background:color, borderRadius:'var(--r-full)', transition:'width 0.8s cubic-bezier(0.4,0,0.2,1)' }}/>
      </div>

      {expanded && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:20 }}>
            {/* Probabilities */}
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Probability Distribution</div>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={probData} layout="vertical" margin={{ left:16, right:16, top:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                  <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:'var(--text-muted)' }} unit="%"/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'var(--text-secondary)' }} width={80}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {probData.map((d,i) => <Cell key={i} fill={d.fill} fillOpacity={0.8}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* SHAP */}
            {shapData.length > 0 && (
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Top Feature Importance (SHAP)</div>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={shapData} layout="vertical" margin={{ left:16, right:16, top:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                    <XAxis type="number" tick={{ fontSize:10, fill:'var(--text-muted)' }}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'var(--text-secondary)', fontFamily:'var(--font-mono)' }} width={80}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="value" radius={[0,4,4,0]}>
                      {shapData.map((d,i) => <Cell key={i} fill={d.direction==='positive'?'var(--resistant)':'var(--susceptible)'} fillOpacity={0.8}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:14, marginTop:8 }}>
                  <span style={{ fontSize:10, color:'var(--resistant)', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, background:'var(--resistant)', borderRadius:2, display:'inline-block' }}/> Increases risk</span>
                  <span style={{ fontSize:10, color:'var(--susceptible)', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, background:'var(--susceptible)', borderRadius:2, display:'inline-block' }}/> Decreases risk</span>
                </div>
              </div>
            )}
          </div>

          {/* Treatment suggestions */}
          {result.treatment_suggestions.length > 0 && (
            <>
              <Divider style={{ margin:'16px 0' }}/>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Treatment Suggestions</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {result.treatment_suggestions.map((s,i) => (
                  <div key={i} style={{
                    padding:'10px 12px', background:'var(--bg-elevated)',
                    border:'1px solid var(--border)', borderRadius:'var(--r-md)',
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12,
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <Pill size={12} color="var(--accent)"/>
                        <span style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{s.antibiotic}</span>
                        <Badge label={s.recommendation} variant={s.recommendation.includes('First')?'susceptible':s.recommendation.includes('Alt')?'intermediate':'resistant'}/>
                      </div>
                      <p style={{ fontSize:12, color:'var(--text-muted)', margin:0, lineHeight:1.5 }}>{s.rationale}</p>
                    </div>
                    <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{(s.confidence*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

export default function Predict() {
  const { results, loading, addResult, clearResults, setLoading, setError } = usePredictionStore()
  const [antibiotics, setAntibiotics] = useState<string[]>([])
  const [species, setSpecies] = useState('E. coli')
  const [antibiotic, setAntibiotic] = useState('Ciprofloxacin')
  const [micValues, setMicValues] = useState<Record<string,string>>({})
  const [genes, setGenes] = useState<Record<string,boolean>>({})

  useEffect(() => {
    predictionApi.antibiotics()
      .then(r => { setAntibiotics(r.data.antibiotics); setAntibiotic(r.data.antibiotics[0] ?? 'Ciprofloxacin') })
      .catch(() => setAntibiotics(['Ciprofloxacin','Amoxicillin','Vancomycin','Meropenem','Tetracycline']))
  }, [])

  const buildFeatures = () => {
    const features: Record<string,number> = {}
    Object.entries(micValues).forEach(([k,v]) => { const n = parseFloat(v); if (!isNaN(n)) features[`MIC_${k}`] = n })
    Object.entries(genes).forEach(([k,v]) => { features[`gene_${k}`] = v ? 1 : 0 })
    return features
  }

  const handleSubmit = async () => {
    setLoading(true); setError(null)
    try {
      const res = await predictionApi.single({ bacterial_species: species, antibiotic, features: buildFeatures() })
      addResult(res.data)
      toast.success(`${res.data.prediction} · ${(res.data.confidence*100).toFixed(0)}% confidence`)
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? 'Prediction failed'
      setError(msg); toast.error(msg)
    } finally { setLoading(false) }
  }

  return (
    <PageWrapper>
      <SectionHeader
        title="Resistance Predictor"
        subtitle="Enter bacterial isolate data to predict antibiotic resistance outcome."
        action={results.length > 0 ? <Button variant="ghost" size="sm" onClick={clearResults}><Trash2 size={12}/> Clear</Button> : undefined}
      />

      <div style={{ display:'grid', gridTemplateColumns:'clamp(280px, 33%, 360px) 1fr', gap:20, alignItems:'start' }}>

        {/* ── Input Panel ── */}
        <Card style={{ position:'sticky', top:'var(--sp-6)' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>01 · Isolate Info</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <Select label="Bacterial Species" options={SPECIES} value={species} onChange={setSpecies} required/>
                <Select label="Target Antibiotic" options={antibiotics.length?antibiotics:['Ciprofloxacin']} value={antibiotic} onChange={setAntibiotic} required/>
              </div>
            </div>

            <Divider/>

            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>02 · MIC Values (µg/mL)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {['Amoxicillin','Ciprofloxacin','Vancomycin','Meropenem','Tetracycline','Gentamicin'].map(ab => (
                  <Input key={ab} label={ab} type="number" placeholder="e.g. 2.0"
                    value={micValues[ab]??''} onChange={e => setMicValues(p => ({...p,[ab]:e.target.value}))}/>
                ))}
              </div>
            </div>

            <Divider/>

            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>03 · Resistance Genes</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {GENES.map(g => (
                  <label key={g} style={{
                    display:'flex', alignItems:'center', gap:7, padding:'6px 9px',
                    background: genes[g] ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${genes[g] ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                    borderRadius:'var(--r-md)', cursor:'pointer', userSelect:'none',
                    transition:'all var(--t-fast)',
                  }}>
                    <input type="checkbox" checked={!!genes[g]}
                      onChange={e => setGenes(p => ({...p,[g]:e.target.checked}))}
                      style={{ accentColor:'var(--accent)', width:12, height:12, flexShrink:0 }}/>
                    <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color: genes[g] ? 'var(--text-accent)' : 'var(--text-secondary)' }}>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSubmit} loading={loading} disabled={loading} fullWidth size="lg">
              <Microscope size={15}/>
              {loading ? 'Predicting...' : 'Run Prediction'}
            </Button>

            <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
              <Info size={11} style={{ color:'var(--text-muted)', flexShrink:0, marginTop:2 }}/>
              <p style={{ fontSize:11, color:'var(--text-muted)', margin:0, lineHeight:1.5 }}>
                All fields are optional. Missing features are filled with population defaults.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Results Panel ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {loading && (
            <Card style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Spinner size={16}/>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Running ensemble model...</span>
            </Card>
          )}

          {results.length === 0 && !loading && (
            <EmptyState
              icon={<FlaskConical size={36}/>}
              title="No predictions yet"
              description="Configure the isolate parameters on the left and click Run Prediction to get started."
            />
          )}

          {results.map(r => <ResultCard key={r.prediction_id} result={r}/>)}
        </div>
      </div>
    </PageWrapper>
  )
}
