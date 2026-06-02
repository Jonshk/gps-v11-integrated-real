"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient, GpsDevice, Vehicle } from "@/lib/adminApi";
import { useTheme } from "@/lib/theme";

const EMPTY: Partial<AppClient> = { username:"", password:"", client_name:"", email:"", phone:"", vehicle_id:"", gps_device_id:"" };

export default function ClientesPage() {
  const { t } = useTheme();
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create"|"edit"|null>(null);
  const [form, setForm]         = useState<Partial<AppClient>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AppClient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const S = {
    page:     { padding:"28px 32px", color:t.text, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:t.bg, minHeight:"100vh" } as React.CSSProperties,
    label:    { display:"block", color:t.textMuted, fontSize:11, fontWeight:700, marginBottom:6, textTransform:"uppercase" as const, letterSpacing:"0.06em" },
    input:    { width:"100%", padding:"10px 14px", background:t.input, border:`1px solid ${t.border}`, borderRadius:10, color:t.text, fontSize:13, boxSizing:"border-box" as const, outline:"none" },
    select:   { width:"100%", padding:"10px 14px", background:t.card, border:`1px solid ${t.border}`, borderRadius:10, color:t.text, fontSize:13, boxSizing:"border-box" as const, outline:"none" },
    btnRed:   { padding:"10px 22px", background:"#e8232a", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(232,35,42,0.25)" } as React.CSSProperties,
    btnGhost: { padding:"7px 14px", background:"transparent", color:t.textMuted, border:`1px solid ${t.border}`, borderRadius:8, fontSize:12, cursor:"pointer" } as React.CSSProperties,
    field:    { marginBottom:16 } as React.CSSProperties,
    errBox:   { padding:"10px 14px", background:"rgba(232,35,42,0.05)", border:"1px solid rgba(232,35,42,0.15)", borderRadius:8, color:"#e8232a", fontSize:13, marginBottom:14 } as React.CSSProperties,
    glass:    { background:t.card, backdropFilter:"blur(20px)", border:`1px solid ${t.border}`, borderRadius:16, boxShadow:"0 2px 20px rgba(0,0,0,0.08)" },
    modal:    { background:t.sidebar, border:`1px solid ${t.border}`, borderRadius:20, padding:32, width:480, maxHeight:"90vh", overflowY:"auto" as const, boxShadow:"0 24px 60px rgba(0,0,0,0.3)" },
    overlay:  { position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  };

  async function load() {
    setLoading(true);
    try {
      const [c,d,v] = await Promise.all([adminApi.getClients(), adminApi.getDevices(), adminApi.getVehicles()]);
      setClients(c); setDevices(d); setVehicles(v);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(c: AppClient) { setForm({...c}); setError(""); setModal("edit"); }
  function close() { if (saving) return; setModal(null); setError(""); setGeneratedPwd(""); }

  async function save() {
    if (!form.client_name?.trim()) { setError("El nombre del cliente es obligatorio."); return; }
    if (!form.username?.trim()) { setError("El usuario es obligatorio."); return; }
    if (/\s/.test(form.username||"")) { setError("El usuario no puede tener espacios."); return; }
    if (modal === "create" && !form.password?.trim()) { setError("La contraseña es obligatoria."); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("El email no es válido."); return; }
    if (form.phone && form.phone.replace(/[\d+\s\-]/g,"").length > 0) { setError("El teléfono solo puede contener números, +, espacios y guiones."); return; }
    setSaving(true); setError("");
    try {
      if (modal==="create") await adminApi.createClient(form);
      else await adminApi.updateClient(form.id!, form);
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteClient(confirmDelete.id);
      await load();
      setConfirmDelete(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    } finally { setDeleting(false); }
  }

  const set = (k: string, v: string) => setForm(f=>({...f,[k]:v}));
  const [generatedPwd, setGeneratedPwd] = useState("");

  function generatePassword() {
    const words = ["Gps","Auto","Ruta","Mapa","Flota","Track","Movi","Safe"];
    const word = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const sym = ["!","@","#","$","%"][Math.floor(Math.random() * 5)];
    const pwd = `${word}${num}${sym}`;
    setGeneratedPwd(pwd);
    setForm(f=>({...f, password: pwd}));
  }
  const COLS = ["Cliente","Credenciales","Vehículo","GPS / SIM","Estado",""];

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.8px", margin:"0 0 4px", color:t.text }}>Clientes</h1>
          <p style={{ color:t.textFaint, fontSize:13, margin:0 }}>{clients.length} clientes registrados · usuarios de la app móvil</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      {loading ? (
        <div style={{ ...S.glass, padding:24 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:60, borderRadius:10, background:t.border, marginBottom:8, animation:"shimmer 1.5s infinite" }}/>)}
        </div>
      ) : clients.length===0 ? (
        <div style={{ ...S.glass, padding:"60px 0", textAlign:"center", color:t.textFaint, fontSize:14 }}>Sin clientes. Crea el primero con el botón de arriba.</div>
      ) : (
        <div style={{ ...S.glass, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1.5fr 100px 160px", padding:"12px 20px", background:t.input, borderBottom:`1px solid ${t.border}` }}>
            {COLS.map(c=><div key={c} style={{ fontSize:10, fontWeight:700, color:t.textFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>{c}</div>)}
          </div>
          {clients.map((c,idx)=>(
            <div key={c.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1.5fr 100px 160px", padding:"16px 20px", alignItems:"center", borderBottom:idx<clients.length-1?`1px solid ${t.border}`:"none", transition:"background 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background=t.input)}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:t.text }}>{c.client_name}</div>
                {c.email && <div style={{ color:t.textFaint, fontSize:11, marginTop:3 }}>{c.email}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                <span style={{ fontFamily:"monospace", fontSize:13, color:t.text, background:t.border, padding:"2px 8px", borderRadius:5, width:"fit-content" }}>{c.username}</span>
                <span style={{ fontFamily:"monospace", fontSize:12, color:t.textFaint, padding:"2px 8px" }}>••••••••</span>
              </div>
              <div style={{ fontSize:13, color:c.vehicle_name?t.text:t.textFaint }}>{c.vehicle_name||"—"}</div>
              <div>
                {c.device_name ? (
                  <><div style={{ fontSize:13, color:t.text, fontWeight:600 }}>{c.device_name}</div>
                  <div style={{ fontFamily:"monospace", color:"#e8232a", fontSize:12, marginTop:2 }}>{c.sim_number}</div></>
                ) : <span style={{ color:t.textFaint, fontSize:13 }}>—</span>}
              </div>
              <div>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:700,
                  background:c.active?"rgba(34,197,94,0.1)":"rgba(107,114,128,0.08)",
                  border:`1px solid ${c.active?"rgba(34,197,94,0.25)":t.border}`,
                  color:c.active?"#16a34a":t.textMuted }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:c.active?"#22c55e":t.textFaint }}/>
                  {c.active?"Activo":"Inactivo"}
                </span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={S.btnGhost} onClick={()=>openEdit(c)}>Editar</button>
                <button style={{ ...S.btnGhost, color:c.active?"#e8232a":"#16a34a", borderColor:c.active?"rgba(232,35,42,0.2)":"rgba(34,197,94,0.2)" }}
                  onClick={()=>adminApi.toggleClient(c.id).then(load)}>{c.active?"Off":"On"}</button>
                <button style={{ ...S.btnGhost, color:"#e8232a", borderColor:"rgba(232,35,42,0.15)", padding:"7px 10px" }}
                  onClick={()=>setConfirmDelete(c)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div style={S.overlay}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <h2 style={{ color:t.text, fontSize:18, fontWeight:800, marginBottom:6 }}>{modal==="create"?"Nuevo cliente":"Editar cliente"}</h2>
            <p style={{ color:t.textFaint, fontSize:12, marginBottom:24 }}>Los datos se guardan en el servidor automáticamente.</p>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.field}><label style={S.label}>Nombre del cliente *</label><input style={S.input} value={form.client_name||""} onChange={e=>set("client_name",e.target.value)} placeholder="Transportes Pérez S.A."/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={S.label}>Usuario app *</label><input style={S.input} value={form.username||""} onChange={e=>set("username",e.target.value)}/></div>
              <div>
                <label style={S.label}>Contraseña app {modal==="edit"&&<span style={{ fontWeight:400, textTransform:"none" }}>(dejar vacío = no cambiar)</span>}</label>
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ ...S.input, flex:1 }} type="text" value={form.password||""} onChange={e=>set("password",e.target.value)} placeholder={modal==="edit"?"Sin cambios":"Escribe o genera"}/>
                  <button type="button" onClick={generatePassword} style={{ padding:"10px 14px", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.25)", borderRadius:10, color:"#3b82f6", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>🔑 Generar</button>
                </div>
                {generatedPwd && form.password === generatedPwd && (
                  <div style={{ marginTop:8, padding:"10px 14px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, fontSize:12 }}>
                    <span style={{ color:"#16a34a", fontWeight:700 }}>✓ Contraseña generada: </span>
                    <span style={{ fontFamily:"monospace", fontWeight:800, color:"#16a34a", fontSize:14 }}>{generatedPwd}</span>
                    <span style={{ color:"#6b7280", marginLeft:8 }}>— Comunícasela al cliente</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={S.label}>Email</label><input style={S.input} type="email" value={form.email||""} onChange={e=>set("email",e.target.value)}/></div>
              <div><label style={S.label}>Teléfono</label><input style={S.input} value={form.phone||""} onChange={e=>set("phone",e.target.value.replace(/[^\d+\s\-]/g,""))} placeholder="+593..."/></div>
            </div>
            <div style={S.field}><label style={S.label}>Vehículo asignado</label>
              <select style={S.select} value={form.vehicle_id||""} onChange={e=>set("vehicle_id",e.target.value)}>
                <option value="">— Sin vehículo —</option>
                {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Dispositivo GPS (SIM)</label>
              <select style={S.select} value={form.gps_device_id||""} onChange={e=>set("gps_device_id",e.target.value)}>
                <option value="">— Sin GPS —</option>
                {devices.filter(d=>d.active).map(d=><option key={d.id} value={d.id}>{d.name} · {d.sim_number}</option>)}
              </select>
            </div>
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
            <h3 style={{ color:t.text, fontSize:16, fontWeight:800, textAlign:"center", margin:"0 0 8px" }}>Eliminar cliente</h3>
            <p style={{ color:t.textFaint, fontSize:13, textAlign:"center", margin:"0 0 24px" }}>
              ¿Estás seguro de eliminar <strong style={{ color:t.text }}>{confirmDelete.client_name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button style={S.btnGhost} onClick={()=>setConfirmDelete(null)} disabled={deleting}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity:deleting?0.6:1 }} onClick={doDelete} disabled={deleting}>
                {deleting?"Eliminando...":"Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}