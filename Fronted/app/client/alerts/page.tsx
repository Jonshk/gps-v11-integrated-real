'use client'
// alerts_page.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/app/client/alerts/page.tsx  (CREAR)
// Dashboard de alertas con timestamps, tipo, vehículo y ubicación

import { useEffect, useRef, useState } from 'react'
import { useClientSession, STATUS_COLOR, API } from '@/lib/useClientSession'

let L: any = null

const ALERT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  speed:    { icon: '🚨', color: '#ef4444', label: 'Velocidad'  },
  battery:  { icon: '🔋', color: '#f59e0b', label: 'Batería'    },
  geofence: { icon: '📍', color: '#00b4d8', label: 'Geocerca'   },
}

export default function AlertsPage() {
  const { session, logout } = useClientSession()
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapObj  = useRef<any>(null)

  const [alerts,    setAlerts]    = useState<any[]>([])
  const [summary,   setSummary]   = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [days,      setDays]      = useState(7)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected,  setSelected]  = useState<any>(null)

  useEffect(() => { if (session) load() }, [session, days, typeFilter])

  async function load() {
    if (!session) return
    setLoading(true)
    const url = `${API}/app/alerts/log?client_id=${session.client_id}&days=${days}&alert_type=${typeFilter}&limit=200`
    const res  = await fetch(url)
    const data = await res.json()
    setAlerts(data.alerts || [])
    setSummary(data.summary)
    setLoading(false)
  }

  async function resolve(id: number) {
    await fetch(`${API}/app/alerts/resolve/${id}`, { method:'POST' })
    setAlerts(prev => prev.map(a => a.id === id ? {...a, resolved:true} : a))
  }

  async function clearResolved() {
    if (!session) return
    await fetch(`${API}/app/alerts/log?client_id=${session.client_id}`, { method:'DELETE' })
    setAlerts(prev => prev.filter(a => !a.resolved))
  }

  // Mapa mini para mostrar ubicación de alerta seleccionada
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return
    import('leaflet').then(lf => {
      L = lf.default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      const map = L.map(mapRef.current!, { zoomControl:false })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains:'abcd', maxZoom:19 }).addTo(map)
      map.setView([-2.1962,-79.8956], 13)
      mapObj.current = map
    })
    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [])

  useEffect(() => {
    if (!selected || !mapObj.current || !L || !selected.lat) return
    mapObj.current.setView([selected.lat, selected.lng], 16)
    const cfg = ALERT_CONFIG[selected.alert_type] || { color:'#fff', icon:'⚠️' }
    const icon = L.divIcon({
      className:'',
      html:`<div style="font-size:24px">${cfg.icon}</div>`,
      iconSize:[24,24], iconAnchor:[12,12],
    })
    L.marker([selected.lat, selected.lng], { icon }).addTo(mapObj.current)
  }, [selected])

  if (!session) return null

  const unresolved = alerts.filter(a => !a.resolved).length

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',
      background:'#050608',fontFamily:"'DM Sans',system-ui,sans-serif",color:'#fff'}}>

      {/* TOPBAR */}
      <header style={{height:'56px',flexShrink:0,background:'#0d1117',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:'12px'}}>
        <a href="/client/dashboard" style={{color:'rgba(255,255,255,0.4)',textDecoration:'none',fontSize:'20px'}}>←</a>
        <span style={{fontWeight:'700',fontSize:'15px'}}>Dashboard de alertas</span>
        {unresolved > 0 && (
          <div style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',
            borderRadius:'20px',padding:'2px 10px',fontSize:'11px',color:'#f87171',fontWeight:'700'}}>
            {unresolved} pendientes
          </div>
        )}
        <div style={{flex:1}}/>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.1)',
          border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',padding:'5px 12px',
          color:'#f87171',fontSize:'12px',cursor:'pointer'}}>Salir</button>
      </header>

      {/* FILTROS + RESUMEN */}
      <div style={{background:'#0d1117',borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'10px 20px',display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap'}}>

        {/* Resumen */}
        {summary && (
          <div style={{display:'flex',gap:'12px'}}>
            {[
              {l:'Total',    v:summary.total,    c:'rgba(255,255,255,0.7)'},
              {l:'Velocidad',v:summary.speed,    c:'#ef4444'},
              {l:'Batería',  v:summary.battery,  c:'#f59e0b'},
              {l:'Geocerca', v:summary.geofence, c:'#00b4d8'},
            ].map(({l,v,c})=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:'9px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</div>
                <div style={{fontSize:'18px',fontWeight:'700',color:c}}>{v}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{flex:1}}/>

        {/* Filtro tipo */}
        <div style={{display:'flex',gap:'4px'}}>
          {['all','speed','battery','geofence'].map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)} style={{
              padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:'600',cursor:'pointer',
              background:typeFilter===t?'rgba(0,180,216,0.15)':'rgba(255,255,255,0.04)',
              border:`1px solid ${typeFilter===t?'rgba(0,180,216,0.3)':'rgba(255,255,255,0.08)'}`,
              color:typeFilter===t?'#00b4d8':'rgba(255,255,255,0.4)',
            }}>{t==='all'?'Todo':ALERT_CONFIG[t]?.label}</button>
          ))}
        </div>

        {/* Filtro días */}
        <select value={days} onChange={e=>setDays(Number(e.target.value))}
          style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'6px',padding:'5px 8px',color:'#fff',fontSize:'12px',cursor:'pointer'}}>
          {[1,3,7,14,30].map(d=><option key={d} value={d}>Últimos {d} días</option>)}
        </select>

        {alerts.some(a=>a.resolved) && (
          <button onClick={clearResolved} style={{padding:'5px 12px',
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:'6px',color:'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer'}}>
            Limpiar resueltas</button>
        )}
      </div>

      {/* CUERPO */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* LISTA */}
        <div style={{width: selected?'50%':'100%',transition:'width 0.3s',
          overflowY:'auto',borderRight:'1px solid rgba(255,255,255,0.06)'}}>
          {loading ? (
            <div style={{padding:'40px',textAlign:'center',color:'rgba(255,255,255,0.3)'}}>
              Cargando alertas...
            </div>
          ) : alerts.length === 0 ? (
            <div style={{padding:'60px',textAlign:'center'}}>
              <div style={{fontSize:'40px',marginBottom:'12px'}}>✅</div>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:'15px'}}>Sin alertas en este período</div>
            </div>
          ) : (
            <div style={{padding:'8px'}}>
              {alerts.map(a => {
                const cfg = ALERT_CONFIG[a.alert_type] || {icon:'⚠️',color:'#fff',label:'Alerta'}
                const isSel = selected?.id === a.id
                return (
                  <div key={a.id}
                    onClick={() => setSelected(isSel ? null : a)}
                    style={{
                      padding:'12px 14px',borderRadius:'10px',marginBottom:'4px',cursor:'pointer',
                      background: a.resolved
                        ? 'rgba(255,255,255,0.01)'
                        : isSel
                          ? `${cfg.color}11`
                          : 'rgba(255,255,255,0.03)',
                      border:`1px solid ${isSel?`${cfg.color}33`:a.resolved?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.07)'}`,
                      opacity: a.resolved ? 0.5 : 1,
                      transition:'all 0.15s',
                    }}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                      <span style={{fontSize:'20px',flexShrink:0}}>{cfg.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'3px'}}>
                          <span style={{fontSize:'12px',fontWeight:'700',color:cfg.color,
                            textTransform:'uppercase',letterSpacing:'0.05em'}}>{cfg.label}</span>
                          <span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)'}}>
                            {_fmtTime(a.created_at)}</span>
                        </div>
                        <div style={{fontSize:'13px',color:a.resolved?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.8)',
                          marginBottom:'4px',wordBreak:'break-word'}}>
                          {a.message.replace(/[*_]/g,'')}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>
                            {a.vehicle_name} {a.speed?`· ${a.speed.toFixed(0)} km/h`:''}
                          </span>
                          {!a.resolved && (
                            <button onClick={e=>{e.stopPropagation();resolve(a.id)}} style={{
                              background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',
                              borderRadius:'5px',padding:'2px 8px',color:'#22c55e',
                              fontSize:'10px',cursor:'pointer',fontWeight:'600'}}>✓ Resolver</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* MAPA lateral */}
        {selected && (
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            <div style={{padding:'12px 16px',background:'#0d1117',
              borderBottom:'1px solid rgba(255,255,255,0.06)',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:'600',fontSize:'13px'}}>{selected.vehicle_name}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>
                  {_fmtFull(selected.created_at)}
                  {selected.speed ? ` · ${selected.speed.toFixed(0)} km/h` : ''}
                  {selected.battery ? ` · 🔋 ${selected.battery.toFixed(0)}%` : ''}
                </div>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',
                color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'20px'}}>×</button>
            </div>
            <div ref={mapRef} style={{flex:1}}/>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
        select option{background:#0d1117;}
      `}</style>
    </div>
  )
}

function _fmtTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' })
  } catch { return '--' }
}
function _fmtFull(iso: string) {
  try {
    return new Date(iso).toLocaleString('es', { day:'2-digit', month:'2-digit',
      hour:'2-digit', minute:'2-digit' })
  } catch { return '--' }
}