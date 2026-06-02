"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WRITE_KEY = process.env.NEXT_PUBLIC_API_WRITE_KEY || "changeme123";

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type":"application/json", ...(method!=="GET"?{"x-api-key":WRITE_KEY}:{}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`Error ${res.status}`); }
  return res.json();
}

type Vehicle = { id:string; name:string; status:string; lat:number; lng:number; speed:number; geofence?:string; updated_at:string };
const EMPTY = { name:"", status:"idle", lat:"-2.1704", lng:"-79.8895", geofence:"" };
const STATUS: Record<string,{label:string;color:string;dot:string}> = {
  active:  { label:"Activo",    color:"#16a34a", dot:"#22c55e" },
  idle:    { label:"En espera", color:"#2563eb", dot:"#3b82f6" },
  offline: { label:"Sin señal", color:"#e8232a", dot:"#f87171" },
};
const COLS = ["Nombre / Placa","Estado","Posición GPS","Geocerca",""];

function isValidCoord(v: string) { return v !== "" && !isNaN(parseFloat(v)); }

export default function VehiculosPage() {
  const { t } = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create"|"edit"|null>(null);
  const [form, setForm]         = useState<Record<string,string>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null);
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
    modal:   { background:t.sidebar, border:`1px solid ${t.border}`, borderRadius:20, padding:32, width:440, boxShadow:"0 24px 60px rgba(0,0,0,0.3)" },
    overlay: { position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  };

  async function load() { setLoading(true); try { setVehicles(await req("GET","/vehicles")); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(v: Vehicle) { setForm({ id:v.id, name:v.name, status:v.status, lat:String(v.lat), lng:String(v.lng), geofence:v.geofence||"" }); setError(""); setModal("edit"); }
  function close() { if (saving) return; setModal(null); setError(""); }

  async function save() {
    if (!form.name?.trim()) { setError("El nombre es obligatorio."); return; }
    if (!isValidCoord(form.lat)) { setError("La latitud debe ser un número válido."); return; }
    if (!isValidCoord(form.lng)) { setError("La longitud debe ser un número válido."); return; }
    const lat = parseFloat(form.lat), lng = parseFloat(form.lng);
    if (lat < -90 || lat > 90) { setError("La latitud debe estar entre -90 y 90."); return; }
    if (lng < -180 || lng > 180) { setError("La longitud debe estar entre -180 y 180."); return; }
    setSaving(true); setError("");
    try {
      const payload = { name:form.name, status:form.status, lat, lng, speed:0, geofence:form.geofence||null };
      if (modal==="create") await req("POST","/vehicles",{...payload,id:"veh-"+form.name.toLowerCase().replace(/[^a-z0-9]/g,"-").slice(0,12)+"-"+Date.now().toString(36)});
      else await req("PATCH",`/vehicles/${form.id}`,payload);
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try { await req("DELETE",`/vehicles/${confirmDelete.id}`); await load(); setConfirmDelete(null); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Error al eliminar"); }
    finally { setDeleting(false); }
  }

  const set = (k: string, v: string) => setForm(f=>({...f,[k]:v}));

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.8px", margin:"0 0 4px", color:t.text }}>Vehículos</h1>
          <p style={{ color:t.textFaint, fontSize:13, margin:0 }}>{vehicles.length} vehículos registrados</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo vehículo</button>
      </div>

      {loading ? (
        <div style={{ ...S.glass, padding:24 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:60, borderRadius:10, background:t.border, marginBottom:8, animation:"shimmer 1.5s infinite" }}/>)}
        </div>
      ) : vehicles.length===0 ? (
        <div style={{ ...S.glass, padding:"60px 0", textAlign:"center", color:t.textFaint, fontSize:14 }}>Sin vehículos. Crea el primero.</div>
      ) : (
        <div style={{ ...S.glass, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 120px 1.5fr 1fr 120px", padding:"12px 20px", background:t.input, borderBottom:`1px solid ${t.border}` }}>
            {COLS.map(c=><div key={c} style={{ fontSize:10, fontWeight:700, color:t.textFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>{c}</div>)}
          </div>
          {vehicles.map((v,idx)=>{
            const st = STATUS[v.status]||{ label:v.status, color:"#6b7280", dot:"#9ca3af" };
            return (
              <div key={v.id} style={{ display:"grid", gridTemplateColumns:"2fr 120px 1.5fr 1fr 120px", padding:"16px 20px", alignItems:"center", borderBottom:idx<vehicles.length-1?`1px solid ${t.border}`:"none", transition:"background 0.15s" }}
                onMouseEnter={e=>(e.currentTarget.style.background=t.input)}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:t.text }}>{v.name}</div>
                  <div style={{ color:t.textFaint, fontSize:10, fontFamily:"monospace", marginTop:3 }}>{v.id}</div>
                </div>
                <div><span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:700, background:`${st.color}12`, border:`1px solid ${st.color}28`, color:st.color }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:st.dot }}/>{st.label}
                </span></div>
                <div style={{ fontFamily:"monospace", fontSize:12, color:t.textMuted }}>{v.lat.toFixed(5)}, {v.lng.toFixed(5)}</div>
                <div style={{ fontSize:13, color:v.geofence?t.text:t.textFaint }}>{v.geofence||"—"}</div>
                <div style={{ display:"flex", gap:6 }}>
                  <button style={S.btnGhost} onClick={()=>openEdit(v)}>Editar</button>
                  <button style={{ ...S.btnGhost, color:"#e8232a", borderColor:"rgba(232,35,42,0.15)", padding:"7px 10px" }} onClick={()=>setConfirmDelete(v)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div style={S.overlay}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{ color:t.text, fontSize:18, fontWeight:800, marginBottom:6 }}>{modal==="create"?"Nuevo vehículo":"Editar vehículo"}</h2>
            <p style={{ color:t.textFaint, fontSize:12, marginBottom:24 }}>Las coordenadas se actualizan solas cuando el GPS reporta posición.</p>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.field}><label style={S.label}>Nombre / Placa *</label><input style={S.input} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Toyota Hilux — ABC-1234"/></div>
            <div style={S.field}><label style={S.label}>Estado inicial</label>
              <select style={S.select} value={form.status} onChange={e=>set("status",e.target.value)}>
                <option value="idle">En espera</option><option value="active">Activo</option><option value="offline">Sin señal</option>
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={S.label}>Latitud (-90 a 90)</label><input style={S.input} value={form.lat} onChange={e=>set("lat",e.target.value.replace(/[^\d.\-]/g,""))} placeholder="-2.1704"/></div>
              <div><label style={S.label}>Longitud (-180 a 180)</label><input style={S.input} value={form.lng} onChange={e=>set("lng",e.target.value.replace(/[^\d.\-]/g,""))} placeholder="-79.8895"/></div>
            </div>
            <div style={S.field}><label style={S.label}>Geocerca (opcional)</label><input style={S.input} value={form.geofence} onChange={e=>set("geofence",e.target.value)}/></div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button style={S.btnGhost} onClick={close} disabled={saving}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity:saving?0.6:1 }} onClick={save} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={S.overlay}>
          <div style={{ background:t.sidebar, border:`1px solid ${t.border}`, borderRadius:16, padding:28, width:360, boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>🗑️</div>
            <h3 style={{ color:t.text, fontSize:16, fontWeight:800, textAlign:"center", margin:"0 0 8px" }}>Eliminar vehículo</h3>
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