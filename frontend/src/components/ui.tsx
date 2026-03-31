// File: frontend/src/components/ui.tsx
import { ReactNode, CSSProperties, forwardRef } from 'react'

export function Card({ children, style, className, onClick }: {
  children: ReactNode; style?: CSSProperties; className?: string; onClick?: () => void
}) {
  return (
    <div className={className} onClick={onClick} style={{
      background:'var(--bg-surface)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', padding:'var(--sp-5)',
      ...(onClick?{cursor:'pointer'}:{}), ...style,
    }}>{children}</div>
  )
}

type BadgeVariant = 'resistant'|'susceptible'|'intermediate'|'default'|'accent'|'ghost'
const BADGE_STYLES: Record<BadgeVariant,CSSProperties> = {
  resistant:   {background:'var(--resistant-dim)',   color:'var(--resistant)',   border:'1px solid var(--resistant-border)'},
  susceptible: {background:'var(--susceptible-dim)', color:'var(--susceptible)', border:'1px solid var(--susceptible-border)'},
  intermediate:{background:'var(--intermediate-dim)',color:'var(--intermediate)',border:'1px solid var(--intermediate-border)'},
  default:     {background:'var(--bg-overlay)',      color:'var(--text-secondary)',border:'1px solid var(--border-strong)'},
  accent:      {background:'var(--accent-dim)',      color:'var(--text-accent)', border:'1px solid rgba(59,130,246,0.25)'},
  ghost:       {background:'transparent',            color:'var(--text-muted)',  border:'1px solid var(--border)'},
}

export function Badge({ label, variant='default', dot }:{label:string;variant?:BadgeVariant;dot?:boolean}) {
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',
      borderRadius:'var(--r-full)',fontSize:11,fontWeight:500,
      fontFamily:'var(--font-sans)',letterSpacing:'0.01em',whiteSpace:'nowrap',
      ...BADGE_STYLES[variant],
    }}>
      {dot&&<span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>}
      {label}
    </span>
  )
}

type BtnVariant = 'primary'|'secondary'|'danger'|'ghost'|'outline'
const BTN_VARIANTS: Record<BtnVariant,CSSProperties> = {
  primary:  {background:'var(--accent)',color:'#fff',border:'1px solid transparent',boxShadow:'0 1px 2px rgba(0,0,0,0.3)'},
  secondary:{background:'var(--bg-elevated)',color:'var(--text-primary)',border:'1px solid var(--border-strong)'},
  danger:   {background:'var(--resistant-dim)',color:'var(--resistant)',border:'1px solid var(--resistant-border)'},
  ghost:    {background:'transparent',color:'var(--text-secondary)',border:'1px solid transparent'},
  outline:  {background:'transparent',color:'var(--text-primary)',border:'1px solid var(--border-strong)'},
}
const BTN_SIZES: Record<string,CSSProperties> = {
  sm:{padding:'5px 11px',fontSize:12,height:28},
  md:{padding:'7px 15px',fontSize:13,height:34},
  lg:{padding:'9px 19px',fontSize:14,height:40},
}

export function Button({children,onClick,variant='primary',disabled=false,loading=false,
  type='button',style,size='md',fullWidth=false}:{
  children:ReactNode;onClick?:()=>void;variant?:BtnVariant;disabled?:boolean;
  loading?:boolean;type?:'button'|'submit'|'reset';style?:CSSProperties;
  size?:'sm'|'md'|'lg';fullWidth?:boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading} style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,
      borderRadius:'var(--r-md)',fontFamily:'var(--font-sans)',fontWeight:500,
      cursor:disabled||loading?'not-allowed':'pointer',opacity:disabled||loading?0.5:1,
      transition:'all var(--t-fast)',outline:'none',whiteSpace:'nowrap',
      width:fullWidth?'100%':undefined,
      ...BTN_SIZES[size],...BTN_VARIANTS[variant],...style,
    }}>
      {loading&&<Spinner size={12}/>}
      {children}
    </button>
  )
}

export const Input = forwardRef<HTMLInputElement,{
  label?:string;name?:string;type?:string;placeholder?:string;
  value?:string|number;onChange?:(e:React.ChangeEvent<HTMLInputElement>)=>void;
  error?:string;required?:boolean;hint?:string;autoComplete?:string;
}>(({label,name,type='text',placeholder,value,onChange,error,required,hint,autoComplete},ref)=>{
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {label&&<label style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}>
        {label}{required&&<span style={{color:'var(--resistant)',fontSize:11}}>*</span>}
      </label>}
      <input ref={ref} name={name} type={type} placeholder={placeholder} value={value}
        onChange={onChange} required={required} autoComplete={autoComplete} style={{
          background:'var(--bg-elevated)',
          border:\`1px solid \${error?'var(--resistant-border)':'var(--border-strong)'}\`,
          borderRadius:'var(--r-md)',padding:'7px 11px',color:'var(--text-primary)',
          fontSize:14,fontFamily:'var(--font-sans)',outline:'none',
          transition:'border-color var(--t-fast),box-shadow var(--t-fast)',width:'100%',height:34,
        }}
        onFocus={e=>{e.target.style.borderColor=error?'var(--resistant)':'var(--border-focus)';e.target.style.boxShadow=error?'0 0 0 3px var(--resistant-dim)':'0 0 0 3px var(--accent-dim)'}}
        onBlur={e=>{e.target.style.borderColor=error?'var(--resistant-border)':'var(--border-strong)';e.target.style.boxShadow='none'}}
      />
      {hint&&!error&&<span style={{fontSize:11,color:'var(--text-muted)'}}>{hint}</span>}
      {error&&<span style={{fontSize:11,color:'var(--resistant)'}}>⚠ {error}</span>}
    </div>
  )
})
Input.displayName='Input'

export function Select({label,options,value,onChange,required}:{
  label?:string;options:string[];value:string;onChange:(v:string)=>void;required?:boolean;
}){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {label&&<label style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)'}}>
        {label}{required&&<span style={{color:'var(--resistant)',marginLeft:3,fontSize:11}}>*</span>}
      </label>}
      <div style={{position:'relative'}}>
        <select value={value} onChange={e=>onChange(e.target.value)} required={required} style={{
          appearance:'none',background:'var(--bg-elevated)',border:'1px solid var(--border-strong)',
          borderRadius:'var(--r-md)',padding:'7px 30px 7px 11px',color:'var(--text-primary)',
          fontSize:14,fontFamily:'var(--font-sans)',outline:'none',cursor:'pointer',width:'100%',height:34,
        }}
          onFocus={e=>{e.target.style.borderColor='var(--border-focus)';e.target.style.boxShadow='0 0 0 3px var(--accent-dim)'}}
          onBlur={e=>{e.target.style.borderColor='var(--border-strong)';e.target.style.boxShadow='none'}}
        >
          {options.map(o=><option key={o} value={o} style={{background:'var(--bg-elevated)'}}>{o}</option>)}
        </select>
        <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text-muted)',fontSize:10}}>▼</span>
      </div>
    </div>
  )
}

export function Spinner({size=18,color='var(--accent)'}:{size?:number;color?:string}){
  return <div style={{width:size,height:size,flexShrink:0,border:'2px solid rgba(255,255,255,0.08)',borderTopColor:color,borderRadius:'50%',animation:'spin 0.65s linear infinite'}}/>
}

export function Skeleton({width='100%',height=20,style}:{width?:string|number;height?:string|number;style?:CSSProperties}){
  return <div className="skeleton" style={{width,height,...style}}/>
}

export function StatCard({label,value,sub,accent,loading}:{label:string;value?:string|number;sub?:string;accent?:string;loading?:boolean}){
  return (
    <Card>
      <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:500,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</div>
      {loading?(
        <><Skeleton height={26} width="55%" style={{marginBottom:8}}/><Skeleton height={11} width="70%"/></>
      ):(
        <>
          <div style={{fontSize:24,fontWeight:700,color:accent??'var(--text-primary)',lineHeight:1,letterSpacing:'-0.03em',fontFamily:'var(--font-mono)'}}>{value}</div>
          {sub&&<div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>{sub}</div>}
        </>
      )}
    </Card>
  )
}

export function SectionHeader({title,subtitle,action}:{title:string;subtitle?:string;action?:ReactNode}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'var(--sp-6)',gap:'var(--sp-4)',flexWrap:'wrap'}}>
      <div>
        <h2 style={{fontSize:18,fontWeight:600,color:'var(--text-primary)',marginBottom:subtitle?4:0,letterSpacing:'-0.02em'}}>{title}</h2>
        {subtitle&&<p style={{fontSize:13,color:'var(--text-muted)',margin:0}}>{subtitle}</p>}
      </div>
      {action&&<div>{action}</div>}
    </div>
  )
}

export function PageWrapper({children}:{children:ReactNode}){
  return (
    <div className="fade-up" style={{padding:'var(--sp-6)',maxWidth:1160,margin:'0 auto',width:'100%'}}>
      {children}
    </div>
  )
}

export function Divider({style}:{style?:CSSProperties}){
  return <div style={{height:1,background:'var(--border)',margin:'var(--sp-4) 0',...style}}/>
}

export function EmptyState({icon,title,description,action}:{icon:ReactNode;title:string;description?:string;action?:ReactNode}){
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'var(--sp-16) var(--sp-8)',border:'1px dashed var(--border-strong)',borderRadius:'var(--r-lg)',gap:'var(--sp-3)'}}>
      <div style={{color:'var(--text-muted)',opacity:0.5}}>{icon}</div>
      <div style={{fontWeight:600,color:'var(--text-secondary)',fontSize:14}}>{title}</div>
      {description&&<p style={{fontSize:13,color:'var(--text-muted)',margin:0,maxWidth:320}}>{description}</p>}
      {action&&<div style={{marginTop:'var(--sp-2)'}}>{action}</div>}
    </div>
  )
}

export function Label({children,style}:{children:ReactNode;style?:CSSProperties}){
  return <div style={{fontSize:11,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',...style}}>{children}</div>
}
