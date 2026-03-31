// File: frontend/src/pages/Analysis.tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { analysisApi } from '../utils/api'
import { Card, PageWrapper, SectionHeader, Spinner, Badge } from '../components/ui'

interface ResistStat { antibiotic:string; resistance_rate:number; total_tested:number; resistant:number; susceptible:number; intermediate:number }

function rateColor(r: number) {
  if (r >= 0.6) return 'var(--resistant)'
  if (r >= 0.3) return 'var(--intermediate)'
  return 'var(--susceptible)'
}

function rateVariant(r: number): 'resistant'|'intermediate'|'susceptible' {
  if (r >= 0.6) return 'resistant'
  if (r >= 0.3) return 'intermediate'
  return 'susceptible'
}

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-strong)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      <p style={{ color:'var(--text-secondary)', marginBottom:4 }}>{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color:p.fill??'var(--text-primary)', fontWeight:500 }}>
        {p.name}: {typeof p.value === 'number' && p.value <= 1 ? `${(p.value*100).toFixed(1)}%` : p.value}
      </p>)}
    </div>
  )
}

export default function Analysis() {
  const [stats, setStats] = useState<ResistStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analysisApi.resistanceStats().then(r => setStats(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <PageWrapper>
      <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={36}/></div>
    </PageWrapper>
  )

  const sorted = [...stats].sort((a,b) => b.resistance_rate - a.resistance_rate)
  const totals = stats.reduce((acc,s) => ({ resistant:acc.resistant+s.resistant, susceptible:acc.susceptible+s.susceptible, intermediate:acc.intermediate+s.intermediate }), {resistant:0,susceptible:0,intermediate:0})
  const pieData = [
    { name:'Resistant',    value:totals.resistant,    fill:'var(--resistant)'    },
    { name:'Susceptible',  value:totals.susceptible,  fill:'var(--susceptible)'  },
    { name:'Intermediate', value:totals.intermediate, fill:'var(--intermediate)' },
  ]
  const radarData = sorted.slice(0,6).map(s => ({
    antibiotic: s.antibiotic.slice(0,9),
    'Resistance': +(s.resistance_rate*100).toFixed(1),
  }))
  const avgRate = stats.reduce((a,s)=>a+s.resistance_rate,0)/stats.length

  return (
    <PageWrapper>
      <SectionHeader title="Resistance Analytics" subtitle="Dataset-level resistance patterns across bacterial isolates and antibiotics."/>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:12, marginBottom:28 }}>
        {[
          { label:'Total Tested',    value:stats.reduce((a,s)=>a+s.total_tested,0).toLocaleString(), color:'var(--text-primary)' },
          { label:'Avg Resistance',  value:`${(avgRate*100).toFixed(1)}%`,  color:'var(--intermediate)' },
          { label:'Highest Risk',    value:sorted[0]?.antibiotic??'—',       color:'var(--resistant)'    },
          { label:'Antibiotics',     value:stats.length,                      color:'var(--accent)'       },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color, fontFamily:'var(--font-mono)', letterSpacing:'-0.03em' }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:16 }}>Resistance Rate by Antibiotic</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} margin={{ bottom:24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
            <XAxis dataKey="antibiotic" tick={{ fontSize:10, fill:'var(--text-muted)' }} angle={-35} textAnchor="end" interval={0}/>
            <YAxis tickFormatter={v=>`${(v*100).toFixed(0)}%`} tick={{ fontSize:11, fill:'var(--text-muted)' }}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="resistance_rate" name="Rate" radius={[3,3,0,0]}>
              {sorted.map((s,i) => <Cell key={i} fill={rateColor(s.resistance_rate)} fillOpacity={0.8}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Two charts */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:20, marginBottom:20 }}>
        <Card>
          <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:16 }}>Outcome Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={{ stroke:'var(--text-muted)' }}>
                {pieData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:16 }}>Resistance Profile Radar</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)"/>
              <PolarAngleAxis dataKey="antibiotic" tick={{ fontSize:10, fill:'var(--text-secondary)' }}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:9, fill:'var(--text-muted)' }} tickFormatter={v=>`${v}%`}/>
              <Radar name="Resistance %" dataKey="Resistance" stroke="var(--resistant)" fill="var(--resistant)" fillOpacity={0.25}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:16 }}>Detailed Resistance Table</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>
                {['Antibiotic','Tested','Resistant','Susceptible','Intermediate','Rate'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:500, color:'var(--text-muted)', borderBottom:'1px solid var(--border)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.antibiotic} style={{ borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-elevated)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  <td style={{ padding:'9px 12px', fontWeight:500, color:'var(--text-primary)' }}>{s.antibiotic}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:12 }}>{s.total_tested.toLocaleString()}</td>
                  <td style={{ padding:'9px 12px', color:'var(--resistant)', fontFamily:'var(--font-mono)', fontSize:12 }}>{s.resistant.toLocaleString()}</td>
                  <td style={{ padding:'9px 12px', color:'var(--susceptible)', fontFamily:'var(--font-mono)', fontSize:12 }}>{s.susceptible.toLocaleString()}</td>
                  <td style={{ padding:'9px 12px', color:'var(--intermediate)', fontFamily:'var(--font-mono)', fontSize:12 }}>{s.intermediate.toLocaleString()}</td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:48, height:4, background:'var(--bg-base)', borderRadius:'var(--r-full)', overflow:'hidden', flexShrink:0 }}>
                        <div style={{ height:'100%', width:`${s.resistance_rate*100}%`, background:rateColor(s.resistance_rate), borderRadius:'var(--r-full)' }}/>
                      </div>
                      <Badge label={`${(s.resistance_rate*100).toFixed(0)}%`} variant={rateVariant(s.resistance_rate)}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageWrapper>
  )
}
