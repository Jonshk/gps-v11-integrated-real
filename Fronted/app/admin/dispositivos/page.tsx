"use client";
import { useEffect, useState } from "react";
import { adminApi, GpsDevice, Vehicle } from "@/lib/adminApi";

const glass = { background:"rgba(255,255,255,0.85)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.9)", borderRadius:16, boxShadow:"0 2px 20px rgba(0,0,0,0.06)" };

const S = {
  page:     { padding:"28px 32px", color:"#1a1a2e", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:"#f0f2f5", minHeight:"100vh" } as React.CSSProperties,
  label:    { display:"block", color:"#6b7280", fontSize:11, fontWeight:700, marginBottom:6, textTransform:"uppercase" as const, letterSpacing:"0.06em" },
  input:    { width:"100%", padding:"10px 14px", background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.1)", borderRadius:10, color:"#1a1a2e", fontSize:13, boxSizing:"border-box" as const, outline:"none" },
  select:   { width:"100%", padding:"10px 14px", background:"#fff", border:"1px solid rgba(0,0,0,0.1)", borderRadius:10, color:"#1a1a2e", fontSize:13, boxSizing:"border-box" as const, outline:"none" },
  btnRed:   { padding:"10px 22px", background:"#e8232a", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(232,35,42,0.25)" } as React.CSSProperties,
  btnGhost: { padding:"7px 14px", background:"transparent", color:"#6b7280", border:"1px solid rgba(0,0,0,0.1)", borderRadius:8, fontSize:12, cursor:"pointer" } as React.CSSProperties,
  field:    { marginBottom:16 } as React.CSSProperties,
  errBox:   { padding:"10px 14px", background:"rgba(232,35,42,0.05)", border:"1px solid rgba(232,35,42,0.15)", borderRadius:8, color:"#e8232a", fontSize:13, marginBottom:14 } as React.CSSProperties,
};

const EMPTY: Partial<GpsDevice> = { name:"", sim_number:"", model:"", imei:"", vehicle_id:"", notes:"" };
const COLS = ["Dispositivo", "Número SIM", "Modelo", "Vehículo", "Cliente", ""];

export default function DispositivosPage() {
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create"|"edit"|null>(null);
  const [form, setForm]         = useState<Partial<GpsDevice>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    try { const [d,v] = await Promise.all([adminApi.getDevices(), adminApi.getVehicles()]); setDevices(d); setVehicles(v); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(d: GpsDevice) { setForm({...d}); setError(""); setModal("edit"); }
  function close() { setModal(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (modal==="create") await adminApi.createDevice(form);
      else await adminApi.updateDevice(form.id!, form);
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  const set = (k: string, v: string) => setForm(f=>({...f,[k]:v}));

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.8px", margin:"0 0 4px", color:"#1a1a2e" }}>Dispositivos GPS</h1>
          <p style={{ color:"#9ca3af", fontSize:13, margin:0 }}>{devices.length} dispositivos · números SIM registrados</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo dispositivo</button>
      </div>

      {loading ? (
        <div style={{ ...glass, padding:24 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:60, borderRadius:10, background:"rgba(0,0,0,0.04)", marginBottom:8, animation:"shimmer 1.5s infinite" }}/>)}
        </div>
      ) : devices.length === 0 ? (
        <div style={{ ...glass, padding:"60px 0", textAlign:"center", color:"#9ca3af", fontSize:14 }}>Sin dispositivos. Agrega el primero.</div>
      ) : (
        <div style={{ ...glass, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 1fr 120px", padding:"12px 20px", background:"rgba(0,0,0,0.02)", borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
            {COLS.map(c=><div key={c} style={{ fontSize:10, fontWeight:700, color:"#9ca3af", letterSpacing:"0.12em", textTransform:"uppercase" }}>{c}</div>)}
          </div>
          {devices.map((d, idx) => (
            <div key={d.id} style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 1fr 120px", padding:"16px 20px", alignItems:"center", borderBottom:idx<devices.length-1?"1px solid rgba(0,0,0,0.05)":"none", transition:"background 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,0,0,0.02)")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"#1a1a2e" }}>{d.name}</div>
                {d.imei && <div style={{ color:"#9ca3af", fontSize:10, fontFamily:"monospace", marginTop:3 }}>{d.imei}</div>}
              </div>
              <div>
                <span style={{ fontFamily:"monospace", fontSize:13, fontWeight:700, color:"#e8232a", background:"rgba(232,35,42,0.06)", border:"1px solid rgba(232,35,42,0.15)", padding:"3px 10px", borderRadius:6 }}>{d.sim_number}</span>
              </div>
              <div style={{ fontSize:13, color:d.model?"#374151":"#d1d5db" }}>{d.model||"—"}</div>
              <div style={{ fontSize:13, color:d.vehicle_name?"#374151":"#d1d5db" }}>{d.vehicle_name||"—"}</div>
              <div>
                {d.client_name
                  ? <><div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{d.client_name}</div><div style={{ fontSize:11, color:"#9ca3af" }}>@{d.username}</div></>
                  : <span style={{ color:"#d1d5db", fontSize:13 }}>—</span>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={S.btnGhost} onClick={()=>openEdit(d)}>Editar</button>
                <button style={{ ...S.btnGhost, color:"#e8232a", borderColor:"rgba(232,35,42,0.15)", padding:"7px 10px" }} onClick={()=>{ if(confirm(`¿Eliminar "${d.name}"?`)) adminApi.deleteDevice(d.id).then(load); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={close}>
          <div style={{ background:"#fff", border:"1px solid rgba(0,0,0,0.08)", borderRadius:20, padding:32, width:460, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ color:"#1a1a2e", fontSize:18, fontWeight:800, marginBottom:6 }}>{modal==="create"?"Nuevo dispositivo GPS":"Editar dispositivo"}</h2>
            <p style={{ color:"#9ca3af", fontSize:12, marginBottom:24 }}>El número SIM es al que se enviarán los comandos SMS.</p>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.field}><label style={S.label}>Nombre del dispositivo</label><input style={S.input} value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="GPS Vehículo 01"/></div>
            <div style={{ ...S.field, background:"rgba(232,35,42,0.04)", border:"1px solid rgba(232,35,42,0.12)", borderRadius:10, padding:14 }}>
              <label style={{ ...S.label, color:"#e8232a" }}>Número SIM del GPS</label>
              <input style={{ ...S.input, fontFamily:"monospace", fontSize:15, fontWeight:700 }} value={form.sim_number||""} onChange={e=>set("sim_number",e.target.value)} placeholder="+5930991234567"/>
              <p style={{ color:"rgba(232,35,42,0.5)", fontSize:11, margin:"6px 0 0" }}>Recibe los comandos SMS. Nunca visible para el cliente.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={S.label}>Modelo</label><input style={S.input} value={form.model||""} onChange={e=>set("model",e.target.value)} placeholder="TK103, GT06..."/></div>
              <div><label style={S.label}>IMEI (opcional)</label><input style={S.input} value={form.imei||""} onChange={e=>set("imei",e.target.value)} placeholder="123456789012345"/></div>
            </div>
            <div style={S.field}><label style={S.label}>Vehículo asociado</label>
              <select style={S.select} value={form.vehicle_id||""} onChange={e=>set("vehicle_id",e.target.value)}>
                <option value="">— Sin vehículo —</option>
                {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Notas</label><input style={S.input} value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Observaciones..."/></div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button style={S.btnGhost} onClick={close}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity:saving?0.6:1 }} onClick={save} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}
