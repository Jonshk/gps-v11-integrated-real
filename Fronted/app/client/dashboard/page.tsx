'use client'
// dashboard_page.tsx  (ACTUALIZADO)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/app/client/dashboard/page.tsx  (REEMPLAZAR)
// Añade links a Alertas y Odómetro en el topbar
// Muestra odómetro del mes en el panel lateral de cada vehículo

import { useEffect, useRef, useState } from 'react'
import { useClientSession, FleetVehicle, STATUS_COLOR, STATUS_LABEL, API, WS_URL } from '@/lib/useClientSession'

let L: any = null

export default function DashboardPage() {
  const { session, logout } = useClientSession()
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapObj  = useRef<any>(null)
  const markers = useRef<Record<string, any>>({})
  const wsRef   = useRef<WebSocket | null>(null)

  const [vehicles,  setVehicles]  = useState<Record<string, FleetVehicle>>({})
  const [selected,  setSelected]  = useState<string | null>(null)
  const [wsLive,    setWsLive]    = useState(false)
  const [sideOpen,  setSideOpen]  = useState(true)
  const [cmdMsg,    setCmdMsg]    = useState('')
  const [cmdLoad,   setCmdLoad]   = useState(false)
  const [odometer,  setOdometer]  = useState<Record<string,number>>({})

  // Inicializar vehículos
  useEffect(() => {
    if (!session) return
    const map: Record<string, FleetVehicle> = {}
    if (session.account_type === 'fleet') {
      session.vehicles.forEach(v => { map[v.device_id] = v })
    } else if (session.vehicle_id) {
      map[session.vehicle_id] = {
        id: session.client_id, device_id: session.vehicle_id,
        name: session.client_name, plate: '', phone: session.phone, status: 'offline',
      }
    }
    setVehicles(map)
    loadOdometer()
  }, [session])

  async function loadOdometer() {
    if (!session) return
    try {
      const res  = await fetch(`${API}/app/odometer/summary?client_id=${session.client_id}`)
      const data = await res.json()
      const map: Record<string,number> = {}
      data.vehicles?.forEach((v:any) => { map[v.vehicle_id] = v.this_month_km })
      setOdometer(map)
    } catch {}
  }

  // Mapa Leaflet
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return
    import('leaflet').then(lf => {
      L = lf.default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      const map = L.map(mapRef.current!, { zoomControl: false })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      map.setView([-2.1962, -79.8956], 13)
      mapObj.current = map
    })
    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [])

  // Marcadores
  useEffect(() => {
    if (!mapObj.current || !L) return
    Object.entries(vehicles).forEach(([did, v]) => {
      if (!v.lat || !v.lng) return
      const c = STATUS_COLOR[v.status || 'offline']
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative">
          <div style="width:36px;height:36px;border-radius:50%;background:${c}22;border:2px solid ${c};
            display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;
            box-shadow:0 0 12px ${c}44;">🚛</div>
          <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);
            background:#0d1117;border:1px solid ${c}66;color:${c};font-size:10px;font-weight:700;
            padding:2px 6px;border-radius:4px;white-space:nowrap;">${v.plate || v.name}</div></div>`,
        iconSize: [36, 58], iconAnchor: [18, 36],
      })
      if (markers.current[did]) {
        markers.current[did].setLatLng([v.lat, v.lng])
        markers.current[did].setIcon(icon)
      } else {
        markers.current[did] = L.marker([v.lat, v.lng], { icon })
          .addTo(mapObj.current).on('click', () => setSelected(did))
      }
    })
  }, [vehicles])

  // WebSocket
  useEffect(() => {
    if (!session) return
    const isFleet = session.account_type === 'fleet'
    const url = isFleet
      ? `${WS_URL}/ws/fleet/${session.client_id}?token=${session.ws_token}`
      : `${WS_URL}/ws/vehicle/${session.vehicle_id}?token=${session.ws_token}`

    function connect() {
      const ws = new WebSocket(url)
      wsRef.current = ws
      ws.onopen  = () => setWsLive(true)
      ws.onclose = () => { setWsLive(false); setTimeout(connect, 5000) }
      ws.onerror = () => ws.close()
      ws.onmessage = ({ data }) => {
        const d = JSON.parse(data)
        if (d.type === 'position_update') {
          setVehicles(prev => ({
            ...prev,
            [d.device_id || d.vehicle_id]: {
              ...(prev[d.device_id || d.vehicle_id] || {} as FleetVehicle),
              lat:d.lat,lng:d.lng,speed:d.speed,heading:d.heading,battery:d.battery,status:d.status,
            }
          }))
        }
      }
    }
    connect()
    return () => wsRef.current?.close()
  }, [session])

  async function sendCmd(cmd: string) {
    if (!session || !selected) return
    setCmdLoad(true); setCmdMsg('')
    try {
      const res = await fetch(`${API}/app/command`, {
        method:'POST',
        headers:{'Content-Type':'application/json','x-app-token':session.token},
        body: JSON.stringify({ command: cmd }),
      })
      setCmdMsg(res.ok?'✓ Enviado':'✗ Error')
    } catch { setCmdMsg('✗ Sin conexión') }
    finally { setCmdLoad(false); setTimeout(()=>setCmdMsg(''),3000) }
  }

  if (!session) return null
  const list = Object.values(vehicles)

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',
      background:'#050608',fontFamily:"'DM Sans',system-ui,sans-serif",color:'#fff',overflow:'hidden'}}>

      {/* TOPBAR */}
      <header style={{height:'56px',flexShrink:0,background:'#0d1117',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:'12px',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'28px',height:'28px',background:'linear-gradient(135deg,#00b4d8,#0077b6)',
            borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>📡</div>
          <span style={{fontWeight:'700',fontSize:'15px',letterSpacing:'-0.3px'}}>GPS Control</span>
        </div>
        <div style={{flex:1}}/>
        {/* EN VIVO */}
        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'4px 10px',
          background:wsLive?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
          border:`1px solid ${wsLive?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,borderRadius:'20px'}}>
          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:wsLive?'#22c55e':'#ef4444'}}/>
          <span style={{fontSize:'11px',fontWeight:'600',color:wsLive?'#22c55e':'#ef4444',
            textTransform:'uppercase',letterSpacing:'0.05em'}}>{wsLive?'En vivo':'Conectando'}</span>
        </div>
        <span style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>{session.client_name}</span>
        {/* Nav links — ahora incluye Alertas y Odómetro */}
        {[
          {l:'Historial',  h:'/client/history'},
          {l:'Geocercas',  h:'/client/geofences'},
          {l:'Alertas',    h:'/client/alerts'},
          {l:'Odómetro',   h:'/client/odometer'},
        ].map(({l,h})=>(
          <a key={l} href={h} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',
            textDecoration:'none',padding:'4px 10px',borderRadius:'6px',transition:'color 0.2s'}}
            onMouseEnter={e=>(e.currentTarget.style.color='#00b4d8')}
            onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}>{l}</a>
        ))}
        <button onClick={logout} style={{background:'rgba(239,68,68,0.1)',
          border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',padding:'5px 12px',
          color:'#f87171',fontSize:'12px',cursor:'pointer'}}>Salir</button>
      </header>

      <div style={{flex:1,display:'flex',overflow:'hidden',position:'relative'}}>

        {/* PANEL LATERAL */}
        <aside style={{width:sideOpen?'320px':'0px',minWidth:sideOpen?'320px':'0px',
          transition:'all 0.4s cubic-bezier(0.32,0.72,0,1)',overflow:'hidden',
          background:'#0d1117',borderRight:'1px solid rgba(255,255,255,0.06)',
          display:'flex',flexDirection:'column',zIndex:5}}>
          <div style={{width:'320px',height:'100%',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'16px 20px 12px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12px',fontWeight:'600',color:'rgba(255,255,255,0.4)',
                  textTransform:'uppercase',letterSpacing:'0.1em'}}>
                  Flota · {list.length} vehículos</span>
                <div style={{display:'flex',gap:'6px'}}>
                  {['active','idle','offline'].map(s=>(
                    <span key={s} style={{display:'flex',alignItems:'center',gap:'3px',
                      fontSize:'10px',color:STATUS_COLOR[s]}}>
                      <span style={{width:'6px',height:'6px',borderRadius:'50%',
                        background:STATUS_COLOR[s],display:'inline-block'}}/>
                      {list.filter(v=>(v.status||'offline')===s).length}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
              {list.map(v => {
                const isSel = selected === v.device_id
                const c = STATUS_COLOR[v.status||'offline']
                const odo = odometer[v.id] || 0
                return (
                  <div key={v.device_id}
                    onClick={() => {setSelected(isSel?null:v.device_id); if(v.lat&&v.lng)mapObj.current?.setView([v.lat,v.lng],16)}}
                    style={{padding:'12px 14px',borderRadius:'12px',marginBottom:'4px',cursor:'pointer',
                      background:isSel?'rgba(0,180,216,0.08)':'transparent',
                      border:`1px solid ${isSel?'rgba(0,180,216,0.25)':'transparent'}`,
                      transition:'all 0.2s cubic-bezier(0.32,0.72,0,1)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:c,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:'600',fontSize:'14px',color:'#fff',marginBottom:'2px'}}>{v.name}</div>
                        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>
                          {v.plate} · {STATUS_LABEL[v.status||'offline']}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:'14px',fontWeight:'700',color:c}}>
                          {(v.speed||0).toFixed(0)} <span style={{fontSize:'10px',fontWeight:'400',color:'rgba(255,255,255,0.3)'}}>km/h</span></div>
                        {odo > 0 && (
                          <div style={{fontSize:'10px',color:'rgba(0,180,216,0.7)'}}>
                            {odo.toLocaleString('es',{maximumFractionDigits:0})} km este mes
                          </div>
                        )}
                      </div>
                    </div>

                    {isSel && (
                      <div style={{marginTop:'12px',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                        <div style={{display:'flex',gap:'6px',marginBottom:'6px'}}>
                          {[{l:'Cortar',cmd:'stop_engine',c:'#ef4444'},{l:'Reanudar',cmd:'start_engine',c:'#22c55e'},{l:'Ubicación',cmd:'locate',c:'#00b4d8'}].map(({l,cmd,c:bc})=>(
                            <button key={cmd} onClick={e=>{e.stopPropagation();sendCmd(cmd)}}
                              disabled={cmdLoad}
                              style={{flex:1,padding:'7px 4px',background:`${bc}11`,
                                border:`1px solid ${bc}33`,borderRadius:'8px',cursor:'pointer',
                                color:bc,fontSize:'10px',fontWeight:'600'}}>{l}</button>
                          ))}
                        </div>
                        {cmdMsg && <div style={{fontSize:'11px',color:cmdMsg.startsWith('✓')?'#22c55e':'#ef4444',textAlign:'center',marginBottom:'6px'}}>{cmdMsg}</div>}
                        <div style={{display:'flex',gap:'4px'}}>
                          <a href={`/client/history?vehicle_id=${v.id}&name=${encodeURIComponent(v.name)}`}
                            style={{flex:1,textAlign:'center',padding:'6px',background:'rgba(255,255,255,0.04)',
                              border:'1px solid rgba(255,255,255,0.08)',borderRadius:'7px',
                              textDecoration:'none',color:'rgba(255,255,255,0.5)',fontSize:'10px',fontWeight:'600'}}>
                            📍 Historial</a>
                          <a href={`/client/alerts?vehicle_id=${v.id}`}
                            style={{flex:1,textAlign:'center',padding:'6px',background:'rgba(239,68,68,0.06)',
                              border:'1px solid rgba(239,68,68,0.15)',borderRadius:'7px',
                              textDecoration:'none',color:'rgba(239,68,68,0.6)',fontSize:'10px',fontWeight:'600'}}>
                            🚨 Alertas</a>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        <button onClick={()=>setSideOpen(!sideOpen)} style={{
          position:'absolute',left:sideOpen?'320px':'0px',top:'50%',transform:'translateY(-50%)',
          width:'20px',height:'48px',background:'#0d1117',
          border:'1px solid rgba(255,255,255,0.08)',borderLeft:'none',
          borderRadius:'0 8px 8px 0',cursor:'pointer',color:'rgba(255,255,255,0.4)',
          fontSize:'10px',zIndex:6,transition:'left 0.4s cubic-bezier(0.32,0.72,0,1)',
        }}>{sideOpen?'‹':'›'}</button>

        <div ref={mapRef} style={{flex:1}}/>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
      `}</style>
    </div>
  )
}