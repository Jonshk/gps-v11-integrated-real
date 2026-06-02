"use client";
import { useEffect, useState } from "react";
import { adminApi, GpsDevice, Vehicle } from "@/lib/adminApi";
import { useTheme } from "@/lib/theme";

const EMPTY: Partial<GpsDevice> = { name:"", sim_number:"", model:"", imei:"", vehicle_id:"", notes:"" };

export default function DispositivosPage() {
  const { t } = useTheme();
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create"|"edit"|null>(null);
  const [form, setForm]         = useState<Partial<GpsDevice>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState<GpsDevice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const S = {
    page:    { padding:"28px 32px", color:t.text, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:t.bg, minHeight:"100vh" } as React.CSSProperties,
    label:   { display:"block", color:t.textMuted, fontSize:11, fontWeight:700, marginBottom:6, textTransform:"uppercase" as const, letterSpacing:"0.06em" },
    input:   { width:"100%", padding:"10px 14px", background:t.input, border:`1px solid ${t.border}`, borderRadius:10, color:t.text, fontSize:13, boxSizing:"border-box" as const, outline:"none" },
    select:  { width:"100%", padding:"10px 14px", background:t.card, border:`1px solid ${t.border}`, borderRadius:10, color:t.text, fontSize:13, boxSizing:"border-box" as const, outline:"none" },
    btnRed:  { padding:"10px 22px", background:"#e8232a", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(232,35,42,0.25)" } as React.CSSProperties,
    btnGhost:{ padding:"7px 14px", background:"transparent", color:t.textMuted, border:`1px solid ${t.border}`, borderRadius:8, fontSize:12, cursor:"pointer" } as React.CSSProperties,
    field:   { marginBottom:16 } as React.CSSProperties,
    errBox:  { padding:"10px 14px", background:"rgba(232,35,42,0.05)", border:"1px solid rgba(232,35,42,0.15)", borderRadius:8, color:"#e8232a", fontSize:13, marginBottom:14 } as React.CSSProperties,
    glass:   { background:t.card, backdropFilter:"blur(20px)", border:`1px solid ${t.border}`, borderRadius:16, boxShadow:"0 2px 20px rgba(0,0,0,0.08)" },
    modal:   { background:t.sidebar, border:`1px solid ${t.border}`, borderRadius:20, padding:32, width:460, maxHeight:"90vh", overflowY:"auto" as const, boxShadow:"0 24px 60px rgba(0,0,0,0.3)" },
    overlay: { position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  };

  async function load() {
    setLoading(true);
    try { const [d,v] = await Promise.all([adminApi.getDevices(), adminApi.getVehicles()]); setDevices(d); setVehicles(v); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(d: GpsDevice) { setForm({...d}); setError(""); setModal("edit"); }
  function close() { if (saving) return; setModal(null); setError(""); }

  async function save() {
    if (!form.name?.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.sim_number?.trim()) { setError("El número SIM es obligatorio."); return; }
    if (!/^\+?[\d\s\-]{7,20}$/.test(form.sim_number)) { setError("El número SIM no es válido. Ej: +17736408523"); return; }
    if (form.imei && !/^\d{15}$/.test(form.imei)) { setError("El IMEI debe tener exactamente 15 dígitos."); return; }
    setSaving(true); setError("");
    try {
      if (modal==="create") await adminApi.createDevice(form);
      else await adminApi.updateDevice(form.id!, form);
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try { await adminApi.deleteDevice(confirmDelete.id); await load(); setConfirmDelete(null); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Error al eliminar"); }
    finally { setDeleting(false); }
  }

  const set = (k: string, v: string) => setForm(f=>({...f,[k]:v}));
  const COLS = ["Dispositivo","Número SIM","Modelo","Vehículo","Cliente",""];

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.8px", margin:"0 0 4px", color:t.text }}>Dispositivos GPS</h1>
          <p style={{ color:t.textFaint, fontSize:13, margin:0 }}>{devices.length} dispositivos · números SIM registrados</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo dispositivo</button>
      </div>

      {loading ? (
        <div style={{ ...S.glass, padding:24 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:60, borderRadius:10, background:t.border, marginBottom:8, animation:"shimmer 1.5s infinite" }}/>)}
        </div>
      ) : devices.length===0 ? (
        <div style={{ ...S.glass, padding:"60px 0", textAlign:"center", color:t.textFaint, fontSize:14 }}>Sin dispositivos. Agrega el primero.</div>
      ) : (
        <div style={{ ...S.glass, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 1fr 120px", padding:"12px 20px", background:t.input, borderBottom:`1px solid ${t.border}` }}>
            {COLS.map(c=><div key={c} style={{ fontSize:10, fontWeight:700, color:t.textFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>{c}</div>)}
          </div>
          {devices.map((d,idx)=>(
            <div key={d.id} style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 1fr 120px", padding:"16px 20px", alignItems:"center", borderBottom:idx<devices.length-1?`1px solid ${t.border}`:"none", transition:"background 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background=t.input)}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:t.text }}>{d.name}</div>
                {d.imei && <div style={{ color:t.textFaint, fontSize:10, fontFamily:"monospace", marginTop:3 }}>{d.imei}</div>}
              </div>
              <div><span style={{ fontFamily:"monospace", fontSize:13, fontWeight:700, color:"#e8232a", background:"rgba(232,35,42,0.08)", border:"1px solid rgba(232,35,42,0.2)", padding:"3px 10px", borderRadius:6 }}>{d.sim_number}</span></div>
              <div style={{ fontSize:13, color:d.model?t.text:t.textFaint }}>{d.model||"—"}</div>
              <div style={{ fontSize:13, color:d.vehicle_name?t.text:t.textFaint }}>{d.vehicle_name||"—"}</div>
              <div>{d.client_name ? <><div style={{ fontSize:13, fontWeight:600, color:t.text }}>{d.client_name}</div><div style={{ fontSize:11, color:t.textFaint }}>@{d.username}</div></> : <span style={{ color:t.textFaint, fontSize:13 }}>—</span>}</div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={S.btnGhost} onClick={()=>openEdit(d)}>Editar</button>
                <button style={{ ...S.btnGhost, color:"#e8232a", borderColor:"rgba(232,35,42,0.15)", padding:"7px 10px" }} onClick={()=>setConfirmDelete(d)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div style={S.overlay}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{ color:t.text, fontSize:18, fontWeight:800, marginBottom:6 }}>{modal==="create"?"Nuevo dispositivo GPS":"Editar dispositivo"}</h2>
            <p style={{ color:t.textFaint, fontSize:12, marginBottom:24 }}>El número SIM es al que se enviarán los comandos SMS.</p>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.field}><label style={S.label}>Nombre del dispositivo *</label><input style={S.input} value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="GPS Vehículo 01"/></div>
            <div style={{ ...S.field, background:"rgba(232,35,42,0.06)", border:"1px solid rgba(232,35,42,0.15)", borderRadius:10, padding:14 }}>
              <label style={{ ...S.label, color:"#e8232a" }}>Número SIM del GPS *</label>
              <input style={{ ...S.input, fontFamily:"monospace", fontSize:15, fontWeight:700 }} value={form.sim_number||""} onChange={e=>set("sim_number",e.target.value.replace(/[^\d+\s\-]/g,""))} placeholder="+17736408523"/>
              <p style={{ color:"rgba(232,35,42,0.5)", fontSize:11, margin:"6px 0 0" }}>Solo números, +, espacios y guiones.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={S.label}>Modelo</label><input style={S.input} value={form.model||""} onChange={e=>set("model",e.target.value)} placeholder="TK103, GT06..."/></div>
              <div><label style={S.label}>IMEI (15 dígitos)</label><input style={S.input} value={form.imei||""} onChange={e=>set("imei",e.target.value.replace(/\D/g,"").slice(0,15))} placeholder="123456789012345" maxLength={15}/></div>
            </div>
            <div style={S.field}><label style={S.label}>Vehículo asociado</label>
              <select style={S.select} value={form.vehicle_id||""} onChange={e=>set("vehicle_id",e.target.value)}>
                <option value="">— Sin vehículo —</option>
                {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Notas</label><input style={S.input} value={form.notes||""} onChange={e=>set("notes",e.target.value)}/></div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button style={S.btnGhost} onClick={close} disabled={saving}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity:saving?0.6:1 }} onClick={save} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmDelete && (
        <div style={S.overlay}>
          <div style={{ background:t.sidebar, border:`1px solid ${t.border}`, borderRadius:16, padding:28, width:360, boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>🗑️</div>
            <h3 style={{ color:t.text, fontSize:16, fontWeight:800, textAlign:"center", margin:"0 0 8px" }}>Eliminar dispositivo</h3>
            <p style={{ color:t.textFaint, fontSize:13, textAlign:"center", margin:"0 0 24px" }}>
              ¿Estás seguro de eliminar <strong style={{ color:t.text }}>{confirmDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button style={S.btnGhost} onClick={()=>setConfirmDelete(null)} disabled={deleting}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity:deleting?0.6:1 }} onClick={doDelete} disabled={deleting}>{deleting?"Eliminando...":"Eliminar"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}