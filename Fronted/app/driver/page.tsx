'use client'
// driver_page.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/app/driver/page.tsx  (CREAR)
// Vista simplificada para el conductor — solo su vehículo y sus stats del día
// Acceso: /driver  (ruta separada, no dentro de /client)

import { useEffect, useRef, useState } from 'react'
import { API, WS_URL } from '@/lib/useClientSession'

const ALERT_ICON: Record<string,string> = {
  speed:'🚨', battery:'🔋', geofence:'📍',
}

export default function DriverPage() {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapObj  = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const wsRef   = useRef<WebSocket|null>(null)

  // Auth
  const [loggedIn,    setLoggedIn]    = useState(false)
  const [driverData,  setDriverData]  = useState<any>(null)
  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [loginError,  setLoginError]  = useState('')
  const [loginLoad,   setLoginLoad]   = useState(false)

  // Live data
  const [speed,   setSpeed]   = useState(0)
  const [status,  setStatus]  = useState('offline')
  const [battery, setBattery] = useState(100)
  const [wsLive,  setWsLive]  = useState(false)

  // Hoy
  const [today,   setToday]   = useState<any>(null)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoad(true); setLoginError('')
    try {
      const res  = await fetch(`${API}/app/drivers/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.detail || 'Credenciales incorrectas'); return }
      setDriverData(data); setLoggedIn(true)
      sessionStorage.setItem('driver_session', JSON.stringify(data))
      loadToday(data.driver_id)
      // Inicializar velocidad/estado desde login
      setSpeed(data.speed || 0)
      setStatus(data.status || 'offline')
    } catch { setLoginError('Error de conexión') }
    finally   { setLoginLoad(false) }
  }

  function logout() {
    wsRef.current?.close()
    sessionStorage.removeItem('driver_session')
    setLoggedIn(false); setDriverData(null)
  }

  async function loadToday(driverId: string) {
    const res  = await fetch(`${API}/app/drivers/${driverId}/today`)
    const data = await res.json()
    setToday(data)
  }

  // Recuperar sesión
  useEffect(() => {
    const raw = sessionStorage.getItem('driver_session')
    if (raw) {
      try {
        const d = JSON.parse(raw)
        setDriverData(d); setLoggedIn(true)
        setSpeed(d.speed||0); setStatus(d.status||'offline')
        loadToday(d.driver_id)
      } catch {}
    }
  }, [])

  // Mapa
  useEffect(() => {
    if (!loggedIn || !mapRef.current || mapObj.current) return
    import('leaflet').then(lf => {
      const L = lf.default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      const map = L.map(mapRef.current!, { zoomControl:false, attributionControl:false })
      lf.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains:'abcd', maxZoom:19 }).addTo(map)
      const pos: [number,number] = [driverData?.lat || -2.1962, driverData?.lng || -79.8956]
      map.setView(pos, 16)
      const icon = lf.divIcon({
        className:'',
        html:`<div style="width:32px;height:32px;border-radius:50%;background:#22c55e22;
          border:2px solid #22c55e;display:flex;align-items:center;justify-content:center;
          font-size:16px;box-shadow:0 0 10px #22c55e44;">🚗</div>`,
        iconSize:[32,32], iconAnchor:[16,16],
      })
      markerRef.current = lf.marker(pos, { icon }).addTo(map)
      mapObj.current = map
    })
    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [loggedIn])

  // WebSocket
  useEffect(() => {
    if (!driverData?.vehicle_id || !driverData?.ws_token) return
    // El conductor usa el ws_token del cliente al que pertenece
    const url = `${WS_URL}/ws/vehicle/${driverData.vehicle_id}?token=${driverData.ws_token || ''}`

    function connect() {
      const ws = new WebSocket(url)
      wsRef.current = ws
      ws.onopen  = () => setWsLive(true)
      ws.onclose = () => { setWsLive(false); setTimeout(connect, 5000) }
      ws.onmessage = ({data}) => {
        const d = JSON.parse(data)
        if (d.type === 'position_update') {
          setSpeed(d.speed||0); setStatus(d.status||'idle'); setBattery(d.battery||100)
          if (mapObj.current && markerRef.current) {
            markerRef.current.setLatLng([d.lat, d.lng])
            mapObj.current.panTo([d.lat, d.lng])
          }
        }
      }
    }
    connect()
    return () => wsRef.current?.close()
  }, [driverData])

  // Pantalla de login
  if (!loggedIn) return (
    <main style={{minHeight:'100dvh',background:'#050608',display:'flex',
      alignItems:'center',justifyContent:'center',
      fontFamily:"'DM Sans',system-ui,sans-serif",position:'relative',overflow:'hidden'}}>
      <div style={{position:'fixed',inset:0,pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:'500px',height:'500px',
          background:'radial-gradient(circle,rgba(34,197,94,0.08) 0%,transparent 70%)',borderRadius:'50%'}}/>
      </div>
      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:'380px',margin:'0 24px'}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'24px',padding:'5px'}}>
          <div style={{background:'#0d1117',borderRadius:'20px',padding:'36px 32px',
            boxShadow:'inset 0 1px 1px rgba(255,255,255,0.05)'}}>
            <div style={{textAlign:'center',marginBottom:'32px'}}>
              <div style={{fontSize:'36px',marginBottom:'8px'}}>🚗</div>
              <div style={{fontWeight:'700',fontSize:'20px',color:'#fff',letterSpacing:'-0.3px'}}>
                Panel del conductor</div>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:'12px',marginTop:'4px'}}>
                GPS Control EC</div>
            </div>
            <form onSubmit={login}>
              {[{l:'Usuario',v:username,s:setUsername,t:'text',p:'tu_usuario'},
                {l:'Contraseña',v:password,s:setPassword,t:'password',p:'••••••••'}].map(f=>(
                <div key={f.l} style={{marginBottom:'14px'}}>
                  <label style={{display:'block',fontSize:'10px',fontWeight:'600',
                    color:'rgba(255,255,255,0.4)',textTransform:'uppercase',
                    letterSpacing:'0.1em',marginBottom:'6px'}}>{f.l}</label>
                  <div style={{background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}}>
                    <input type={f.t} value={f.v} onChange={e=>f.s(e.target.value)}
                      placeholder={f.p} required
                      style={{width:'100%',padding:'11px 14px',background:'transparent',
                        border:'none',outline:'none',color:'#fff',fontSize:'14px',boxSizing:'border-box'}}/>
                  </div>
                </div>
              ))}
              {loginError && <div style={{background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',
                padding:'8px 12px',color:'#f87171',fontSize:'12px',marginBottom:'14px'}}>
                {loginError}</div>}
              <button type="submit" disabled={loginLoad} style={{width:'100%',padding:'13px',
                background:'linear-gradient(135deg,#22c55e,#16a34a)',
                border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',
                fontWeight:'600',cursor:'pointer'}}>
                {loginLoad?'Entrando...':'Entrar →'}</button>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input::placeholder{color:rgba(255,255,255,0.2);}*{box-sizing:border-box;}
      `}</style>
    </main>
  )

  // Panel conductor
  const statusColor = status==='active'?'#22c55e':status==='idle'?'#f59e0b':'#ef4444'
  const statusLabel = status==='active'?'En ruta':status==='idle'?'Detenido':'Sin señal'

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',
      background:'#050608',fontFamily:"'DM Sans',system-ui,sans-serif",color:'#fff',overflow:'hidden'}}>

      {/* TOPBAR */}
      <header style={{height:'52px',flexShrink:0,background:'#0d1117',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex',alignItems:'center',padding:'0 16px',gap:'10px'}}>
        <div style={{fontSize:'18px'}}>🚗</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:'700',fontSize:'14px'}}>{driverData?.driver_name}</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>
            {driverData?.vehicle_name} {driverData?.plate?`· ${driverData.plate}`:''}
          </div>
        </div>
        {/* EN VIVO */}
        <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'3px 8px',
          background:wsLive?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
          border:`1px solid ${wsLive?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,borderRadius:'16px'}}>
          <div style={{width:'5px',height:'5px',borderRadius:'50%',
            background:wsLive?'#22c55e':'#ef4444'}}/>
          <span style={{fontSize:'10px',fontWeight:'600',
            color:wsLive?'#22c55e':'#ef4444'}}>{wsLive?'En vivo':'...'}</span>
        </div>
        <button onClick={logout} style={{background:'none',border:'none',
          color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>⏻</button>
      </header>

      {/* KPIs */}
      <div style={{background:'#0d1117',borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'10px 16px',display:'flex',gap:'0',flexShrink:0}}>
        {[
          {l:'VELOCIDAD', v:`${speed.toFixed(0)} km/h`, c:speed>80?'#ef4444':'#22c55e'},
          {l:'ESTADO',    v:statusLabel,                 c:statusColor},
          {l:'BATERÍA',   v:`${battery.toFixed(0)}%`,    c:battery<20?'#ef4444':'rgba(255,255,255,0.7)'},
          {l:'HOY',       v:`${today?.today_km||0} km`,  c:'#00b4d8'},
        ].map(({l,v,c},i)=>(
          <div key={l} style={{flex:1,textAlign:'center',
            borderRight:i<3?'1px solid rgba(255,255,255,0.06)':'none'}}>
            <div style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',textTransform:'uppercase',
              letterSpacing:'0.08em',marginBottom:'3px'}}>{l}</div>
            <div style={{fontSize:'16px',fontWeight:'700',color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* MAPA */}
      <div style={{flex:1,position:'relative'}}>
        <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
      </div>

      {/* STATS DEL DÍA */}
      {today && (
        <div style={{background:'#0d1117',borderTop:'1px solid rgba(255,255,255,0.06)',
          padding:'12px 16px',flexShrink:0}}>
          <div style={{fontSize:'10px',fontWeight:'700',color:'rgba(255,255,255,0.3)',
            textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'10px'}}>Resumen de hoy</div>
          <div style={{display:'flex',gap:'12px',marginBottom: today.today_alerts?.length?'10px':'0'}}>
            {[
              {l:'Recorrido',  v:`${today.today_km} km`},
              {l:'Vel. máxima', v:`${today.today_max_speed} km/h`},
              {l:'Tiempo activo', v:`${today.today_active_min} min`},
            ].map(({l,v})=>(
              <div key={l} style={{flex:1,background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',
                padding:'8px 10px',textAlign:'center'}}>
                <div style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',marginBottom:'3px'}}>{l}</div>
                <div style={{fontSize:'14px',fontWeight:'700',color:'#fff'}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Alertas del día */}
          {today.today_alerts?.length > 0 && (
            <div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',
                textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px'}}>
                Alertas de hoy</div>
              <div style={{maxHeight:'80px',overflowY:'auto'}}>
                {today.today_alerts.map((a:any, i:number)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',
                    padding:'5px 8px',borderRadius:'6px',marginBottom:'3px',
                    background:'rgba(255,255,255,0.02)'}}>
                    <span style={{fontSize:'14px'}}>{ALERT_ICON[a.alert_type]||'⚠️'}</span>
                    <span style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',flex:1,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {a.message.replace(/[*_]/g,'')}</span>
                    <span style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',flexShrink:0}}>
                      {new Date(a.created_at).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        *{box-sizing:border-box;margin:0;padding:0;}
      `}</style>
    </div>
  )
}