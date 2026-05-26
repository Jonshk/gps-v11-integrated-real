"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient, GpsDevice, Vehicle } from "@/lib/adminApi";

const glass = { background:"rgba(255,255,255,0.85)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.9)", borderRadius:16, boxShadow:"0 2px 20px rgba(0,0,0,0.06)" };

const S = {
  page:   { padding:"28px 32px", color:"#1a1a2e", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:"#f0f2f5", minHeight:"100vh" } as React.CSSProperties,
  select: { width:"100%", padding:"8px 12px", background:"#fff", border:"1px solid rgba(0,0,0,0.1)", borderRadius:8, color:"#374151", fontSize:12, outline:"none" },
};

const COLS = ["Cliente", "Vehículo asignado", "Dispositivo GPS", "Estado"];

export default function AsignacionesPage() {
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string|null>(null);
  const [msg, setMsg]           = useState("");

  async function load() {
    setLoading(true);
    try { const [c,d,v] = await Promise.all([adminApi.getClients(), adminApi.getDevices(), adminApi.getVehicles()]); setClients(c); setDevices(d); setVehicles(v); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function assign(clientId: string, field: "vehicle_id"|"gps_device_id", value: string) {
    setSaving(clientId+field);
    try { await adminApi.updateClient(clientId, { [field]: value||undefined }); setMsg("✓ Guardado"); setTimeout(()=>setMsg(""),2000); await load(); }
    finally { setSaving(null); }
  }

  return (
    <div style={S.page}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.8px", margin:"0 0 4px", color:"#1a1a2e" }}>Asignaciones</h1>
        <p style={{ color:"#9ca3af", fontSize:13, margin:0 }}>Vincula cada cliente con su vehículo y dispositivo GPS</p>
      </div>

      {/* Steps */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[
          { n:"1", title:"Registra el GPS",  sub:"Agrega el número SIM en Dispositivos", color:"#e8232a" },
          { n:"2", title:"Crea el cliente",  sub:"Define usuario y contraseña",           color:"#16a34a" },
          { n:"3", title:"Asigna aquí",      sub:"Vincula todo en esta tabla",            color:"#2563eb" },
        ].map(s => (
          <div key={s.n} style={{ ...glass, padding:"16px 18px" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:`${s.color}0f`, border:`1px solid ${s.color}25`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
              <span style={{ color:s.color, fontWeight:800, fontSize:13 }}>{s.n}</span>
            </div>
            <div style={{ fontWeight:700, fontSize:13, color:"#1a1a2e", marginBottom:3 }}>{s.title}</div>
            <div style={{ color:"#9ca3af", fontSize:11, lineHeight:1.5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {msg && <div style={{ marginBottom:14, padding:"9px 14px", background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:8, color:"#16a34a", fontSize:12, fontWeight:600 }}>{msg}</div>}

      {loading ? (
        <div style={{ ...glass, padding:24 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:60, borderRadius:10, background:"rgba(0,0,0,0.04)", marginBottom:8, animation:"shimmer 1.5s infinite" }}/>)}
        </div>
      ) : clients.length === 0 ? (
        <div style={{ ...glass, padding:"60px 0", textAlign:"center", color:"#9ca3af", fontSize:14 }}>Sin clientes. Crea uno primero.</div>
      ) : (
        <div style={{ ...glass, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.5fr 2fr 2fr 140px", padding:"12px 20px", background:"rgba(0,0,0,0.02)", borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
            {COLS.map(c=><div key={c} style={{ fontSize:10, fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase" }}>{c}</div>)}
          </div>
          {clients.map((c, idx) => {
            const sim = devices.find(d=>d.id===c.gps_device_id)?.sim_number;
            const ready = Boolean(c.vehicle_id && c.gps_device_id);
            return (
              <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1.5fr 2fr 2fr 140px", padding:"16px 20px", alignItems:"center", borderBottom:idx<clients.length-1?"1px solid rgba(0,0,0,0.05)":"none", transition:"background 0.15s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.02)")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1a1a2e" }}>{c.client_name}</div>
                  <div style={{ color:"#9ca3af", fontSize:11, fontFamily:"monospace", marginTop:3 }}>@{c.username}</div>
                </div>
                <div style={{ paddingRight:12 }}>
                  <select style={S.select} value={c.vehicle_id||""} disabled={saving===c.id+"vehicle_id"} onChange={e=>assign(c.id,"vehicle_id",e.target.value)}>
                    <option value="">— Sin vehículo —</option>
                    {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div style={{ paddingRight:12 }}>
                  <select style={S.select} value={c.gps_device_id||""} disabled={saving===c.id+"gps_device_id"} onChange={e=>assign(c.id,"gps_device_id",e.target.value)}>
                    <option value="">— Sin GPS —</option>
                    {devices.filter(d=>d.active).map(d=><option key={d.id} value={d.id}>{d.name} · {d.sim_number}</option>)}
                  </select>
                  {sim && <div style={{ marginTop:5, fontSize:10, fontFamily:"monospace", color:"#e8232a" }}>SMS → {sim}</div>}
                </div>
                <div>
                  {ready ? (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:999, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", color:"#16a34a", fontSize:11, fontWeight:700 }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e" }}/> Listo
                    </span>
                  ) : (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:999, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", color:"#d97706", fontSize:11, fontWeight:700 }}>
                      ⚠ Incompleto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}
