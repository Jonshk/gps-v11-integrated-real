"use client";
import { useEffect, useState } from "react";
import { adminApi, GpsDevice, Vehicle } from "@/lib/adminApi";

const S = {
  page:   { padding: "28px 32px", color: "#f0f6ff", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: "#0a0a0a", minHeight: "100vh" } as React.CSSProperties,
  label:  { display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6 } as React.CSSProperties,
  input:  { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  select: { width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  btnRed:   { padding: "11px 22px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnGhost: { padding: "7px 14px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  field:  { marginBottom: 16 } as React.CSSProperties,
  errBox: { padding: "10px 14px", background: "rgba(232,35,42,0.08)", border: "1px solid rgba(232,35,42,0.25)", borderRadius: 8, color: "#ff6b6b", fontSize: 13, marginBottom: 14 } as React.CSSProperties,
};

const EMPTY: Partial<GpsDevice> = { name: "", sim_number: "", model: "", imei: "", vehicle_id: "", notes: "" };
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
      if (modal === "create") await adminApi.createDevice(form);
      else await adminApi.updateDevice(form.id!, form);
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:32 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.8px", margin:"0 0 6px", color:"#fff" }}>Dispositivos GPS</h1>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>{devices.length} dispositivos · números SIM registrados</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo dispositivo</button>
      </div>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:64, borderRadius:12, background:"rgba(255,255,255,0.03)", animation:"shimmer 1.5s infinite" }}/>)}
        </div>
      ) : devices.length === 0 ? (
        <div style={{ padding:"60px 0", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:14 }}>Sin dispositivos. Agrega el primero.</div>
      ) : (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 1fr 120px", padding:"12px 20px", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            {COLS.map(c=><div key={c} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", textTransform:"uppercase" }}>{c}</div>)}
          </div>
          {devices.map((d, idx) => (
            <div key={d.id} style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 1fr 120px", padding:"16px 20px", alignItems:"center", borderBottom:idx<devices.length-1?"1px solid rgba(255,255,255,0.05)":"none", transition:"background 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.025)")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:"#fff" }}>{d.name}</div>
                {d.imei && <div style={{ color:"rgba(255,255,255,0.2)", fontSize:10, fontFamily:"monospace", marginTop:3 }}>{d.imei}</div>}
              </div>
              <div>
                <span style={{ fontFamily:"monospace", fontSize:14, fontWeight:700, color:"#e8232a", background:"rgba(232,35,42,0.08)", border:"1px solid rgba(232,35,42,0.15)", padding:"3px 10px", borderRadius:6 }}>{d.sim_number}</span>
              </div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>{d.model||<span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>}</div>
              <div style={{ fontSize:13, color:d.vehicle_name?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.2)" }}>{d.vehicle_name||"—"}</div>
              <div>
                {d.client_name
                  ? <><div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.7)" }}>{d.client_name}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>@{d.username}</div></>
                  : <span style={{ color:"rgba(255,255,255,0.2)", fontSize:13 }}>—</span>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={S.btnGhost} onClick={()=>openEdit(d)}>Editar</button>
                <button style={{ ...S.btnGhost, color:"#f87171", borderColor:"rgba(248,113,113,0.15)", padding:"7px 10px" }} onClick={()=>{ if(confirm(`¿Eliminar "${d.name}"?`)) adminApi.deleteDevice(d.id).then(load); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={close}>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:32, width:460, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, marginBottom:6, letterSpacing:"-0.5px" }}>{modal==="create"?"Nuevo dispositivo GPS":"Editar dispositivo"}</h2>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, marginBottom:24 }}>El número SIM es al que se enviarán los comandos SMS.</p>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.field}><label style={S.label}>Nombre del dispositivo</label><input style={S.input} value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="GPS Vehículo 01"/></div>
            <div style={{ ...S.field, background:"rgba(232,35,42,0.05)", border:"1px solid rgba(232,35,42,0.15)", borderRadius:10, padding:14 }}>
              <label style={{ ...S.label, color:"#e8232a" }}>Número SIM del GPS</label>
              <input style={{ ...S.input, fontFamily:"monospace", fontSize:16, fontWeight:700, letterSpacing:"0.05em" }} value={form.sim_number||""} onChange={e=>set("sim_number",e.target.value)} placeholder="+5930991234567"/>
              <p style={{ color:"rgba(232,35,42,0.45)", fontSize:11, margin:"6px 0 0" }}>Recibe los comandos SMS. Nunca visible para el cliente.</p>
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