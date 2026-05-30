'use client'
// odometer_page.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/app/client/odometer/page.tsx  (CREAR)

import { useEffect, useState } from 'react'
import { useClientSession, API } from '@/lib/useClientSession'

export default function OdometerPage() {
  const { session, logout } = useClientSession()

  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [months,  setMonths]  = useState(3)

  useEffect(() => { if (session) load() }, [session, months])

  async function load() {
    if (!session) return
    setLoading(true)
    const res  = await fetch(`${API}/app/odometer/monthly?client_id=${session.client_id}&months=${months}`)
    const data = await res.json()
    setData(data)
    setLoading(false)
  }

  if (!session) return null

  const vehicles: any[] = data?.vehicles || []
  const totalFleet = vehicles.reduce((s: number, v: any) => s + (v.total_km || 0), 0)

  return (
    <div style={{minHeight:'100dvh',background:'#050608',
      fontFamily:"'DM Sans',system-ui,sans-serif",color:'#fff'}}>

      {/* TOPBAR */}
      <header style={{height:'56px',background:'#0d1117',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:'12px',
        position:'sticky',top:0,zIndex:10}}>
        <a href="/client/dashboard" style={{color:'rgba(255,255,255,0.4)',textDecoration:'none',fontSize:'20px'}}>←</a>
        <span style={{fontWeight:'700',fontSize:'15px'}}>Odómetro acumulado</span>
        <div style={{flex:1}}/>
        <select value={months} onChange={e=>setMonths(Number(e.target.value))}
          style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'6px',padding:'5px 8px',color:'#fff',fontSize:'12px',cursor:'pointer'}}>
          {[1,3,6,12].map(m=><option key={m} value={m}>{m} {m===1?'mes':'meses'}</option>)}
        </select>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.1)',
          border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',padding:'5px 12px',
          color:'#f87171',fontSize:'12px',cursor:'pointer'}}>Salir</button>
      </header>

      <div style={{padding:'20px',maxWidth:'900px',margin:'0 auto'}}>

        {/* Total flota */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'16px',padding:'5px',marginBottom:'20px'}}>
          <div style={{background:'#0d1117',borderRadius:'12px',padding:'20px 24px',
            boxShadow:'inset 0 1px 1px rgba(255,255,255,0.04)',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',textTransform:'uppercase',
                letterSpacing:'0.12em',marginBottom:'6px'}}>Total flota · últimos {months} meses</div>
              <div style={{fontSize:'36px',fontWeight:'700',color:'#00b4d8',letterSpacing:'-1px'}}>
                {totalFleet.toLocaleString('es', {maximumFractionDigits:0})}
                <span style={{fontSize:'18px',fontWeight:'400',color:'rgba(255,255,255,0.4)',marginLeft:'6px'}}>km</span>
              </div>
            </div>
            <div style={{fontSize:'40px',opacity:0.3}}>🛣️</div>
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,0.3)'}}>
            Cargando odómetro...
          </div>
        ) : vehicles.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,0.3)'}}>
            Sin datos de recorrido disponibles
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {vehicles.map((v: any) => {
              const maxKm = Math.max(...vehicles.map((x:any)=>x.total_km||0), 1)
              const barPct = Math.round((v.total_km / maxKm) * 100)
              return (
                <div key={v.vehicle_id} style={{
                  background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',
                  borderRadius:'14px',padding:'18px 20px'}}>

                  {/* Header vehículo */}
                  <div style={{display:'flex',justifyContent:'space-between',
                    alignItems:'flex-start',marginBottom:'14px'}}>
                    <div>
                      <div style={{fontWeight:'700',fontSize:'15px',color:'#fff',marginBottom:'3px'}}>
                        {v.vehicle_name}</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>
                        {v.plate || 'Sin placa'}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'22px',fontWeight:'700',color:'#00b4d8'}}>
                        {v.total_km.toLocaleString('es', {maximumFractionDigits:0})}
                        <span style={{fontSize:'12px',fontWeight:'400',color:'rgba(255,255,255,0.35)',marginLeft:'4px'}}>km total</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra visual total */}
                  <div style={{height:'4px',background:'rgba(255,255,255,0.06)',
                    borderRadius:'2px',marginBottom:'16px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${barPct}%`,
                      background:'linear-gradient(90deg,#00b4d8,#0077b6)',
                      borderRadius:'2px',transition:'width 0.8s cubic-bezier(0.32,0.72,0,1)'}}/>
                  </div>

                  {/* Tabla meses */}
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    {v.months.map((m: any) => {
                      const monthMax = Math.max(...v.months.map((x:any)=>x.km||0), 1)
                      const pct = Math.round((m.km / monthMax) * 100)
                      return (
                        <div key={m.month} style={{
                          flex:'1 1 80px',minWidth:'80px',
                          background:'rgba(255,255,255,0.03)',
                          border:'1px solid rgba(255,255,255,0.06)',
                          borderRadius:'10px',padding:'10px 12px',textAlign:'center'}}>
                          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',
                            marginBottom:'6px'}}>
                            {_fmtMonth(m.month)}</div>
                          {/* Mini barra */}
                          <div style={{height:'3px',background:'rgba(255,255,255,0.06)',
                            borderRadius:'2px',marginBottom:'6px',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${pct}%`,
                              background:'#00b4d8',borderRadius:'2px'}}/>
                          </div>
                          <div style={{fontSize:'14px',fontWeight:'700',color:'#fff'}}>
                            {m.km.toLocaleString('es',{maximumFractionDigits:0})}
                            <span style={{fontSize:'9px',color:'rgba(255,255,255,0.35)',marginLeft:'2px'}}>km</span>
                          </div>
                          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',marginTop:'2px'}}>
                            {m.max_speed.toFixed(0)} km/h máx
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        select option{background:#0d1117;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
      `}</style>
    </div>
  )
}

function _fmtMonth(ym: string) {
  try {
    const [y, m] = ym.split('-')
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${months[parseInt(m)-1]} ${y.slice(2)}`
  } catch { return ym }
}