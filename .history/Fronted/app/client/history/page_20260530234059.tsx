'use client'
// history_page.tsx  (CON REPLAY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/app/client/history/page.tsx  (REEMPLAZAR)
//
// Añade vs versión anterior:
// - Botón ▶ Replay que anima el marcador punto a punto
// - Control de velocidad del replay (1x, 2x, 5x, 10x)
// - Barra de progreso del replay
// - Odómetro del día en el resumen

import { useEffect, useRef, useState, useCallback } from 'react'
import { useClientSession, API } from '@/lib/useClientSession'
import { useSearchParams } from 'next/navigation'

let L: any = null

export default function HistoryPage() {
  const { session, logout } = useClientSession()
  const params = useSearchParams()

  const mapRef    = useRef<HTMLDivElement>(null)
  const mapObj    = useRef<any>(null)
  const polyRef   = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const replayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [vehicleId,   setVehicleId]   = useState(params.get('vehicle_id') || '')
  const [vehicleName, setVehicleName] = useState(params.get('name') || '')
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]
  })
  const [points,    setPoints]    = useState<any[]>([])
  const [summary,   setSummary]   = useState<any>(null)
  const [loading,   setLoading]   = useState(false)

  // Replay state
  const [replaying,  setReplaying]  = useState(false)
  const [replayIdx,  setReplayIdx]  = useState(0)
  const [replaySpeed, setReplaySpeed] = useState(5)   // puntos por segundo
  const [replayDone,  setReplayDone]  = useState(false)

  // Mapa
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return
    import('leaflet').then(lf => {
      L = lf.default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      const map = L.map(mapRef.current!, { zoomControl: false })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains:'abcd', maxZoom:19 }).addTo(map)
      L.control.zoom({ position:'bottomright' }).addTo(map)
      map.setView([-2.1962,-79.8956], 13)
      mapObj.current = map
    })
    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [])

  // Cargar ruta
  async function loadRoute() {
    if (!session || !vehicleId) return
    stopReplay()
    setLoading(true); setPoints([]); setSummary(null); setReplayIdx(0); setReplayDone(false)
    try {
      const res  = await fetch(`${API}/app/history/route?vehicle_id=${vehicleId}&date=${date}&client_id=${session.client_id}`)
      const data = await res.json()
      setPoints(data.points || [])
      setSummary(data.summary)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (vehicleId) loadRoute() }, [vehicleId, date, session])

  // Dibujar ruta en mapa
  useEffect(() => {
    if (!mapObj.current || !L) return
    polyRef.current?.remove()
    markerRef.current?.remove()
    markerRef.current = null

    if (points.length < 2) return
    const ll = points.map((p: any) => [p.lat, p.lng])
    const poly = L.polyline(ll, { color:'#00b4d8', weight:3, opacity:0.6 }).addTo(mapObj.current)
    polyRef.current = poly
    mapObj.current.fitBounds(poly.getBounds(), { padding:[50,50] })

    // Marcadores inicio/fin
    const si = L.divIcon({ className:'', html:'<div style="font-size:20px">🟢</div>', iconSize:[20,20], iconAnchor:[10,10] })
    const ei = L.divIcon({ className:'', html:'<div style="font-size:20px">🔴</div>', iconSize:[20,20], iconAnchor:[10,10] })
    L.marker(ll[0], { icon:si }).addTo(mapObj.current)
    L.marker(ll[ll.length-1], { icon:ei }).addTo(mapObj.current)
  }, [points])

  // ── REPLAY ────────────────────────────────────────────────
  function startReplay() {
    if (points.length < 2) return
    setReplaying(true); setReplayDone(false)
    const start = replayDone ? 0 : replayIdx
    setReplayIdx(start)
    runReplay(start)
  }

  function runReplay(idx: number) {
    if (idx >= points.length) {
      setReplaying(false); setReplayDone(true); return
    }
    const p = points[idx]
    const ll: [number, number] = [p.lat, p.lng]

    // Mover marcador
    if (!markerRef.current && mapObj.current && L) {
      const icon = L.divIcon({
        className:'',
        html:`<div style="width:28px;height:28px;border-radius:50%;
          background:#f59e0b22;border:2px solid #f59e0b;
          display:flex;align-items:center;justify-content:center;font-size:14px;">🚛</div>`,
        iconSize:[28,28], iconAnchor:[14,14],
      })
      markerRef.current = L.marker(ll, { icon }).addTo(mapObj.current)
    } else if (markerRef.current) {
      markerRef.current.setLatLng(ll)
    }

    // Centrar mapa en el marcador
    mapObj.current?.panTo(ll, { animate: true, duration: 0.3 })
    setReplayIdx(idx)

    // Siguiente punto
    const interval = Math.max(50, 1000 / replaySpeed)
    replayRef.current = setTimeout(() => runReplay(idx + 1), interval)
  }

  function stopReplay() {
    if (replayRef.current) clearTimeout(replayRef.current)
    setReplaying(false)
  }

  function resetReplay() {
    stopReplay()
    setReplayIdx(0); setReplayDone(false)
    markerRef.current?.remove(); markerRef.current = null
  }

  const progress = points.length > 0 ? Math.round((replayIdx / (points.length - 1)) * 100) : 0

  if (!session) return null

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',
      background:'#050608',fontFamily:"'DM Sans',system-ui,sans-serif",color:'#fff'}}>

      {/* TOPBAR */}
      <header style={{height:'56px',flexShrink:0,background:'#0d1117',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:'12px'}}>
        <a href="/client/dashboard" style={{color:'rgba(255,255,255,0.4)',textDecoration:'none',fontSize:'20px'}}>←</a>
        <span style={{fontWeight:'700',fontSize:'15px'}}>Historial de rutas</span>
        <div style={{flex:1}}/>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.1)',
          border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',padding:'5px 12px',
          color:'#f87171',fontSize:'12px',cursor:'pointer'}}>Salir</button>
      </header>

      {/* CONTROLES */}
      <div style={{background:'#0d1117',borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'10px 20px',display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap'}}>

        <input type="date" value={date} max={new Date().toISOString().split('T')[0]}
          onChange={e=>{setDate(e.target.value); resetReplay()}}
          style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'8px',padding:'8px 12px',color:'#fff',fontSize:'13px',colorScheme:'dark'}}/>

        {/* KPIs */}
        {summary && (
          <div style={{display:'flex',gap:'14px'}}>
            {[['Distancia',`${summary.total_km} km`],['Vel. máx',`${summary.max_speed} km/h`],
              ['Paradas',summary.stop_count],['Puntos',summary.point_count]].map(([l,v])=>(
              <div key={l as string} style={{textAlign:'center'}}>
                <div style={{fontSize:'9px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</div>
                <div style={{fontSize:'15px',fontWeight:'700',color:'#00b4d8'}}>{v}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{flex:1}}/>

        {/* Replay controls */}
        {points.length > 1 && (
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {/* Velocidad */}
            <select value={replaySpeed} onChange={e=>setReplaySpeed(Number(e.target.value))}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'6px',padding:'6px 8px',color:'#fff',fontSize:'12px',cursor:'pointer'}}>
              {[1,2,5,10,20].map(s=><option key={s} value={s}>{s}x</option>)}
            </select>

            {/* Reset */}
            <button onClick={resetReplay} style={{padding:'7px 10px',
              background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'7px',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:'13px'}}>⏮</button>

            {/* Play / Pause */}
            <button onClick={replaying ? stopReplay : startReplay} style={{
              padding:'7px 16px',
              background:replaying?'rgba(245,158,11,0.15)':'rgba(0,180,216,0.15)',
              border:`1px solid ${replaying?'rgba(245,158,11,0.3)':'rgba(0,180,216,0.3)'}`,
              borderRadius:'7px',cursor:'pointer',
              color:replaying?'#f59e0b':'#00b4d8',fontSize:'13px',fontWeight:'600'}}>
              {replaying ? '⏸ Pausar' : replayDone ? '↺ Repetir' : '▶ Replay'}</button>
          </div>
        )}

        {/* Descargas */}
        {vehicleId && (<>
          <a href={`${API}/app/reports/pdf?vehicle_id=${vehicleId}&date_from=${date}&date_to=${date}&client_id=${session.client_id}`}
            target="_blank" style={{padding:'7px 12px',background:'rgba(239,68,68,0.1)',
              border:'1px solid rgba(239,68,68,0.25)',borderRadius:'7px',color:'#f87171',
              fontSize:'12px',fontWeight:'600',textDecoration:'none'}}>⬇ PDF</a>
          <a href={`${API}/app/reports/excel?vehicle_id=${vehicleId}&date_from=${date}&date_to=${date}&client_id=${session.client_id}`}
            target="_blank" style={{padding:'7px 12px',background:'rgba(34,197,94,0.1)',
              border:'1px solid rgba(34,197,94,0.25)',borderRadius:'7px',color:'#22c55e',
              fontSize:'12px',fontWeight:'600',textDecoration:'none'}}>⬇ Excel</a>
        </>)}
      </div>

      {/* Barra de progreso replay */}
      {points.length > 1 && (
        <div style={{height:'3px',background:'rgba(255,255,255,0.06)',flexShrink:0}}>
          <div style={{height:'100%',width:`${progress}%`,
            background:'linear-gradient(90deg,#00b4d8,#f59e0b)',
            transition:'width 0.1s linear'}}/>
        </div>
      )}

      {/* MAPA */}
      <div style={{flex:1,position:'relative'}}>
        <div ref={mapRef} style={{width:'100%',height:'100%'}}/>

        {loading && (
          <div style={{position:'absolute',inset:0,background:'rgba(5,6,8,0.7)',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#00b4d8',fontSize:'14px'}}>Cargando ruta...</span>
          </div>
        )}

        {!loading && points.length===0 && vehicleId && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#0d1117',border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:'14px',padding:'24px 32px',textAlign:'center'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>📭</div>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:'14px'}}>Sin datos para este día</div>
            </div>
          </div>
        )}

        {/* Indicador velocidad durante replay */}
        {replaying && replayIdx < points.length && (
          <div style={{position:'absolute',bottom:'16px',left:'50%',transform:'translateX(-50%)',
            background:'rgba(13,17,23,0.9)',border:'1px solid rgba(245,158,11,0.3)',
            borderRadius:'20px',padding:'6px 16px',display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#f59e0b',
              animation:'pulse 1s infinite'}}/>
            <span style={{color:'#f59e0b',fontSize:'13px',fontWeight:'600'}}>
              {(points[replayIdx]?.speed || 0).toFixed(0)} km/h
            </span>
            <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>
              {replayIdx+1}/{points.length}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        select option{background:#0d1117;}
      `}</style>
    </div>
  )
}