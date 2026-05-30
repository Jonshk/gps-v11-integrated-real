'use client'
// geofences_page.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/app/client/geofences/page.tsx  (CREAR)

import { useEffect, useRef, useState } from 'react'
import { useClientSession, API } from '@/lib/useClientSession'

let L: any = null

interface GF { id:string; name:string; type:string; center_lat:number; center_lng:number; radius_m:number; active:boolean; alert_enter:boolean; alert_exit:boolean }

export default function GeofencesPage() {
  const { session, logout } = useClientSession()
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapObj    = useRef<any>(null)
  const previewRef = useRef<any>(null)

  const [gfs,      setGfs]      = useState<GF[]>([])
  const [creating, setCreating] = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [name,     setName]     = useState('')
  const [radius,   setRadius]   = useState('500')
  const [center,   setCenter]   = useState<[number,number]|null>(null)
  const [aEnter,   setAEnter]   = useState(true)
  const [aExit,    setAExit]    = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { if (session) load() }, [session])

  async function load() {
    if (!session) return
    setLoading(true)
    const res  = await fetch(`${API}/app/geofences?client_id=${session.client_id}`)
    const data = await res.json()
    setGfs(data.geofences || [])
    setLoading(false)
  }

  async function del(id: string) {
    await fetch(`${API}/app/geofences/${id}`, { method:'DELETE' }); load()
  }

  // Mapa
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return
    import('leaflet').then(lf => {
      L = lf.default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      const map = L.map(mapRef.current!, { zoomControl:false })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains:'abcd', maxZoom:19 }).addTo(map)
      L.control.zoom({ position:'bottomright' }).addTo(map)
      map.setView([-2.1962,-79.8956], 13)
      map.on('click', (e: any) => { if (creating) setCenter([e.latlng.lat, e.latlng.lng]) })
      mapObj.current = map
    })
    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [])

  // Dibujar geocercas existentes
  useEffect(() => {
    if (!mapObj.current || !L) return
    gfs.forEach(gf => {
      if (!gf.center_lat) return
      L.circle([gf.center_lat, gf.center_lng], {
        radius: gf.radius_m, color:'#00b4d8',
        fillColor:'#00b4d8', fillOpacity:0.08, weight:1.5,
      }).addTo(mapObj.current).bindTooltip(gf.name, {
        permanent:true, direction:'center', className:'gf-label'
      })
    })
  }, [gfs])

  // Preview círculo
  useEffect(() => {
    if (!mapObj.current || !L || !center) return
    previewRef.current?.remove()
    previewRef.current = L.circle(center, {
      radius: parseFloat(radius)||500, color:'#f59e0b',
      fillColor:'#f59e0b', fillOpacity:0.12, weight:2, dashArray:'6',
    }).addTo(mapObj.current)
  }, [center, radius])

  async function save() {
    if (!session || !center || !name.trim()) return
    setSaving(true)
    await fetch(`${API}/app/geofences`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        client_id: session.client_id, name: name.trim(), type:'circle',
        center_lat: center[0], center_lng: center[1],
        radius_m: parseFloat(radius)||500,
        alert_enter: aEnter, alert_exit: aExit,
      }),
    })
    setSaving(false); setCreating(false); setName(''); setCenter(null)
    previewRef.current?.remove(); load()
  }

  if (!session) return null

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',
      background:'#050608',fontFamily:"'DM Sans',system-ui,sans-serif",color:'#fff'}}>

      {/* TOPBAR */}
      <header style={{height:'56px',flexShrink:0,background:'#0d1117',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:'12px'}}>
        <a href="/client/dashboard" style={{color:'rgba(255,255,255,0.4)',textDecoration:'none',fontSize:'20px'}}>←</a>
        <span style={{fontWeight:'700',fontSize:'15px'}}>Geocercas</span>
        <div style={{flex:1}}/>
        <button onClick={()=>{setCreating(!creating);setCenter(null)}} style={{
          padding:'7px 14px',
          background:creating?'rgba(245,158,11,0.15)':'rgba(0,180,216,0.1)',
          border:`1px solid ${creating?'rgba(245,158,11,0.3)':'rgba(0,180,216,0.25)'}`,
          borderRadius:'8px',cursor:'pointer',
          color:creating?'#f59e0b':'#00b4d8',fontSize:'12px',fontWeight:'600'}}>
          {creating?'✕ Cancelar':'+ Nueva'}</button>
        <button onClick={logout} style={{background:'rgba(239,68,68,0.1)',
          border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',padding:'5px 12px',
          color:'#f87171',fontSize:'12px',cursor:'pointer'}}>Salir</button>
      </header>

      {creating && (
        <div style={{background:'rgba(245,158,11,0.06)',borderBottom:'1px solid rgba(245,158,11,0.2)',
          padding:'8px 20px',display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'14px'}}>👆</span>
          <span style={{fontSize:'12px',color:'#f59e0b'}}>Toca el mapa para colocar el centro</span>
        </div>
      )}

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* PANEL */}
        <aside style={{width:'300px',minWidth:'300px',background:'#0d1117',
          borderRight:'1px solid rgba(255,255,255,0.06)',
          display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {creating && (
            <div style={{padding:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)',
              background:'rgba(245,158,11,0.03)'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:'#f59e0b',
                textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'12px'}}>Nueva geocerca</div>
              {[
                {ph:'Nombre',val:name,set:setName,type:'text'},
                {ph:'Radio (metros)',val:radius,set:setRadius,type:'number'},
              ].map(f=>(
                <input key={f.ph} type={f.type} placeholder={f.ph} value={f.val}
                  onChange={e=>f.set(e.target.value)}
                  style={{width:'100%',padding:'8px 12px',marginBottom:'8px',
                    background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
                    borderRadius:'8px',color:'#fff',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/>
              ))}
              <div style={{display:'flex',gap:'12px',marginBottom:'12px'}}>
                {[{l:'Al entrar',v:aEnter,s:setAEnter},{l:'Al salir',v:aExit,s:setAExit}].map(({l,v,s})=>(
                  <label key={l} style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                    <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{accentColor:'#00b4d8'}}/>
                    <span style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{l}</span>
                  </label>
                ))}
              </div>
              {!center && <div style={{fontSize:'11px',color:'rgba(245,158,11,0.7)',marginBottom:'8px'}}>⚠ Toca el mapa para definir el centro</div>}
              <button onClick={save} disabled={saving||!center||!name.trim()} style={{
                width:'100%',padding:'9px',borderRadius:'8px',cursor:'pointer',
                background:(!center||!name.trim())?'rgba(255,255,255,0.05)':'rgba(0,180,216,0.15)',
                border:`1px solid ${(!center||!name.trim())?'rgba(255,255,255,0.08)':'rgba(0,180,216,0.3)'}`,
                color:(!center||!name.trim())?'rgba(255,255,255,0.25)':'#00b4d8',
                fontSize:'13px',fontWeight:'600',boxSizing:'border-box'}}>
                {saving?'Guardando...':'Guardar geocerca'}</button>
            </div>
          )}

          <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
            <div style={{padding:'8px 12px 4px',fontSize:'11px',fontWeight:'600',
              color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>
              {gfs.length} geocercas</div>
            {loading
              ? <div style={{padding:'20px',textAlign:'center',color:'rgba(255,255,255,0.3)'}}>Cargando...</div>
              : gfs.length===0
                ? <div style={{padding:'20px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>Sin geocercas</div>
                : gfs.map(gf=>(
                  <div key={gf.id} style={{padding:'11px 13px',borderRadius:'10px',marginBottom:'4px',
                    background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontWeight:'600',fontSize:'13px',color:'#fff',marginBottom:'3px'}}>{gf.name}</div>
                        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>
                          Radio: {gf.radius_m?.toFixed(0)} m{gf.alert_enter?' · ↓ Entrar':''}{gf.alert_exit?' · ↑ Salir':''}</div>
                      </div>
                      <button onClick={()=>del(gf.id)} style={{background:'none',border:'none',
                        cursor:'pointer',color:'rgba(239,68,68,0.5)',fontSize:'14px',padding:'2px 4px'}}>🗑</button>
                    </div>
                  </div>
                ))
            }
          </div>
        </aside>

        <div ref={mapRef} style={{flex:1}}/>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        *{box-sizing:border-box;margin:0;padding:0;}
        .gf-label{background:rgba(0,180,216,0.15)!important;border:1px solid rgba(0,180,216,0.3)!important;
          color:#00b4d8!important;font-size:11px!important;font-weight:600!important;
          padding:2px 6px!important;border-radius:4px!important;box-shadow:none!important;}
        input::placeholder{color:rgba(255,255,255,0.2);}
      `}</style>
    </div>
  )
}