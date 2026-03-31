// File: frontend/src/pages/GeneNetwork.tsx
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { genesApi, analysisApi } from '../utils/api'
import { Card, PageWrapper, SectionHeader, Spinner, Badge } from '../components/ui'

interface GNode { id:string; gene_name:string; mechanism:string; drug_class:string; prevalence_score:number; degree:number; betweenness_centrality:number; x?:number; y?:number; fx?:number|null; fy?:number|null }
interface GEdge { source:string; target:string; weight:number; relationship:string }
interface NetworkData { nodes:GNode[]; edges:GEdge[]; stats:Record<string,number> }
interface Community { community_id:number; size:number; dominant_drug_class:string; members:GNode[] }

const MECH_COLORS: Record<string,string> = {
  'Beta-lactamase':'#60a5fa','Carbapenemase':'#f87171','ESBL':'#fb923c',
  'PBP2a alteration':'#a78bfa','D-Ala-D-Lac ligase':'#f472b6',
  'Aminoglycoside acetyltransferase':'#34d399','Aminoglycoside phosphotransferase':'#22d3ee',
  'rRNA methylation':'#fbbf24','Ribosomal protection':'#a3e635',
  'Efflux pump':'#c084fc','DHPS alteration':'#fb7185',
  'DNA gyrase protection':'#38bdf8','DHFR alteration':'#4ade80',
  'Lipid A modification':'#fcd34d',
}
function nodeColor(m: string) { return MECH_COLORS[m] ?? '#64748b' }

export default function GeneNetwork() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [network, setNetwork] = useState<NetworkData|null>(null)
  const [communities, setCommunities] = useState<Community[]>([])
  const [selected, setSelected] = useState<GNode|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([genesApi.network(), analysisApi.geneCommunities()])
      .then(([n,c]) => { setNetwork(n.data); setCommunities(c.data.communities) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!network || !svgRef.current) return
    const el = svgRef.current
    const W = el.clientWidth || 700
    const H = 500
    d3.select(el).selectAll('*').remove()

    const svg = d3.select(el).attr('viewBox', `0 0 ${W} ${H}`)
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'node-glow')
    filter.append('feGaussianBlur').attr('stdDeviation', 2.5).attr('result', 'blur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'blur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const g = svg.append('g')
    svg.call(d3.zoom<SVGSVGElement,unknown>().scaleExtent([0.3,3]).on('zoom', e => g.attr('transform', e.transform)))

    const nodes: GNode[] = network.nodes.map(n => ({...n}))
    const nodeById = new Map(nodes.map(n => [n.id, n]))
    const links = network.edges.map(e => ({
      source: nodeById.get(e.source)!,
      target: nodeById.get(e.target)!,
      weight: e.weight,
    })).filter(l => l.source && l.target)

    const sim = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links).id((d:any)=>d.id).distance(90).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(W/2, H/2))
      .force('collision', d3.forceCollide().radius((d:any)=>7+d.degree*2.5))

    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', 'rgba(255,255,255,0.07)')
      .attr('stroke-width', (d:any)=>d.weight*2.5)
      .attr('stroke-linecap', 'round')

    const node = g.append('g').selectAll<SVGCircleElement,GNode>('circle')
      .data(nodes).join('circle')
      .attr('r', (d:any)=>5+d.degree*2.5)
      .attr('fill', (d:any)=>nodeColor(d.mechanism))
      .attr('fill-opacity', 0.9)
      .attr('stroke', (d:any)=>`${nodeColor(d.mechanism)}40`)
      .attr('stroke-width', 3)
      .attr('filter', 'url(#node-glow)')
      .style('cursor', 'pointer')
      .on('click', (_e,d:any)=>setSelected(d))
      .call(
        d3.drag<SVGCircleElement,GNode>()
          .on('start',(e,d:any)=>{if(!e.active)sim.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y})
          .on('drag',(e,d:any)=>{d.fx=e.x;d.fy=e.y})
          .on('end',(e,d:any)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null})
      )

    const label = g.append('g').selectAll('text').data(nodes).join('text')
      .attr('font-size', 8.5)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', 'rgba(148,163,184,0.8)')
      .attr('pointer-events', 'none')
      .attr('dy', (d:any)=>-(6+d.degree*2.5)-3)
      .attr('text-anchor', 'middle')
      .text((d:any)=>d.gene_name)

    sim.on('tick', () => {
      link.attr('x1',(d:any)=>d.source.x).attr('y1',(d:any)=>d.source.y).attr('x2',(d:any)=>d.target.x).attr('y2',(d:any)=>d.target.y)
      node.attr('cx',(d:any)=>d.x).attr('cy',(d:any)=>d.y)
      label.attr('x',(d:any)=>d.x).attr('y',(d:any)=>d.y)
    })

    return () => { sim.stop() }
  }, [network])

  return (
    <PageWrapper>
      <SectionHeader title="Gene Network" subtitle="Force-directed co-occurrence graph. Drag nodes, scroll to zoom. Click a node to inspect."/>

      <div style={{ display:'grid', gridTemplateColumns:'1fr clamp(220px, 25%, 280px)', gap:16, alignItems:'start' }}>
        {/* Graph */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          {loading ? (
            <div style={{ height:500, display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={32}/></div>
          ) : (
            <svg ref={svgRef} style={{ width:'100%', height:500, display:'block' }}/>
          )}
        </Card>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {network && (
            <Card>
              <div style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Graph Stats</div>
              {Object.entries(network.stats).map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>{k.replace(/_/g,' ')}</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-accent)', fontSize:11 }}>{typeof v==='number'?v.toFixed(4):v}</span>
                </div>
              ))}
            </Card>
          )}

          {selected && (
            <Card style={{ border:`1px solid ${nodeColor(selected.mechanism)}30`, animation:'fadeIn 0.2s ease' }}>
              <div style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Selected</div>
              <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:14, color:nodeColor(selected.mechanism), marginBottom:10 }}>{selected.gene_name}</div>
              {[
                ['Mechanism', selected.mechanism],
                ['Drug Class', selected.drug_class],
                ['Prevalence', `${(selected.prevalence_score*100).toFixed(0)}%`],
                ['Connections', selected.degree],
                ['Centrality', selected.betweenness_centrality.toFixed(4)],
              ].map(([k,v]) => (
                <div key={String(k)} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:11, textAlign:'right', maxWidth:130 }}>{String(v)}</span>
                </div>
              ))}
            </Card>
          )}

          <Card>
            <div style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Mechanism Legend</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {Object.entries(MECH_COLORS).slice(0,10).map(([m,c]) => (
                <div key={m} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color:'var(--text-secondary)' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0 }}/>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m}</span>
                </div>
              ))}
            </div>
          </Card>

          {communities.length > 0 && (
            <Card>
              <div style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Communities</div>
              {communities.map(c => (
                <div key={c.community_id} style={{ padding:'7px 0', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <div>
                    <div style={{ color:'var(--text-secondary)', fontWeight:500, marginBottom:2 }}>Group {c.community_id}</div>
                    <div style={{ color:'var(--text-muted)', fontSize:11 }}>{c.dominant_drug_class}</div>
                  </div>
                  <Badge label={`${c.size} genes`} variant="accent"/>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
