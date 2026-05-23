"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient, GpsDevice, Vehicle } from "@/lib/adminApi";

const S = {
  page:     { padding: "28px 32px", color: "#f0f6ff", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: "#0a0a0a", minHeight: "100vh" } as React.CSSProperties,
  label:    { display: "block", color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 6 },
  input:    { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  select:   { width: "100%", padding: "10px 14px", background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  btnRed:   { padding: "10px 18px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnGhost: { padding: "7px 12px", background: "transparent", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, fontSize: 11, cursor: "pointer" } as React.CSSProperties,
  th:       { padding: "11px 16px", textAlign: "left" as const, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td:       { padding: "13px 16px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const },
  field:    { marginBottom: 14 } as React.CSSProperties,
  errBox:   { padding: "10px 14px", background: "rgba(232,35,42,0.08)", border: "1px solid rgba(232,35,42,0.2)", borderRadius: 8, color: "#e8232a", fontSize: 13, marginBottom: 14 } as React.CSSProperties,
};

const EMPTY: Partial<AppClient> = { username: "", password: "", client_name: "", email: "", phone: "", vehicle_id: "", gps_device_id: "" };

export default function ClientesPage() {
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create"|"edit"|null>(null);
  const [form, setForm]         = useState<Partial<AppClient>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    try { const [c,d,v] = await Promise.all([adminApi.getClients(), adminApi.getDevices(), adminApi.getVehicles()]); setClients(c); setDevices(d); setVehicles(v); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(c: AppClient) { setForm({...c}); setError(""); setModal("edit"); }
  function close() { setModal(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (modal === "create") await adminApi.createClient(form);
      else await adminApi.updateClient(form.id!, form);
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));
  const badge = (active: number) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700,
    background: active ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
    color: active ? "#22c55e" : "rgba(255,255,255,0.3)",
  });

  return (
    <div style={S.page}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "#e8232a", textTransform: "uppercase", margin: "0 0 4px" }}>GPS Control EC</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.6px", margin: 0 }}>Clientes</h1>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>{clients.length} clientes registrados</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      {loading ? (
        <div style={{ height: 200, borderRadius: 16, background: "rgba(255,255,255,0.03)", animation: "shimmer 1.5s infinite" }}/>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(20px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["Cliente","Usuario","Contraseña","Vehículo","GPS / SIM","Estado",""].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,0.2)", padding: 40 }}>Sin clientes. Crea el primero.</td></tr>
              ) : clients.map(c => (
                <tr key={c.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 700, color: "#fff" }}>{c.client_name}</div>
                    {c.email && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>{c.email}</div>}
                  </td>
                  <td style={{ ...S.td, fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{c.username}</td>
                  <td style={{ ...S.td, fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>{c.password}</td>
                  <td style={S.td}>{c.vehicle_name || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                  <td style={S.td}>
                    {c.device_name
                      ? <><div style={{ fontWeight: 600, fontSize: 12 }}>{c.device_name}</div><div style={{ fontFamily: "monospace", color: "#e8232a", fontSize: 11 }}>{c.sim_number}</div></>
                      : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                  </td>
                  <td style={S.td}><span style={badge(c.active)}>{c.active ? "Activo" : "Inactivo"}</span></td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    <button style={{ ...S.btnGhost, marginRight: 6 }} onClick={() => openEdit(c)}>Editar</button>
                    <button style={{ ...S.btnGhost, color: c.active ? "#f87171" : "#22c55e" }} onClick={() => adminApi.toggleClient(c.id).then(load)}>
                      {c.active ? "Desactivar" : "Activar"}
                    </button>
                    <button style={{ ...S.btnGhost, marginLeft: 6, color: "#f87171" }} onClick={() => { if(confirm(`¿Eliminar "${c.client_name}"?`)) adminApi.deleteClient(c.id).then(load); }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={close}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 480, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.4px" }}>{modal === "create" ? "Nuevo cliente" : "Editar cliente"}</h2>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.field}><label style={S.label}>Nombre del cliente</label><input style={S.input} value={form.client_name||""} onChange={e=>set("client_name",e.target.value)} placeholder="Transportes Pérez"/></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={S.label}>Usuario app</label><input style={S.input} value={form.username||""} onChange={e=>set("username",e.target.value)} placeholder="juan.perez"/></div>
              <div><label style={S.label}>Contraseña app</label><input style={S.input} value={form.password||""} onChange={e=>set("password",e.target.value)} placeholder="****"/></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={S.label}>Email</label><input style={S.input} value={form.email||""} onChange={e=>set("email",e.target.value)}/></div>
              <div><label style={S.label}>Teléfono</label><input style={S.input} value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div>
            </div>
            <div style={S.field}><label style={S.label}>Vehículo</label>
              <select style={S.select} value={form.vehicle_id||""} onChange={e=>set("vehicle_id",e.target.value)}>
                <option value="">— Sin vehículo —</option>
                {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Dispositivo GPS</label>
              <select style={S.select} value={form.gps_device_id||""} onChange={e=>set("gps_device_id",e.target.value)}>
                <option value="">— Sin GPS —</option>
                {devices.filter(d=>d.active).map(d=><option key={d.id} value={d.id}>{d.name} · {d.sim_number}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={S.btnGhost} onClick={close}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity: saving?0.6:1 }} onClick={save} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}