"use client";
import { useEffect, useState } from "react";
import { adminApi, GpsDevice, Vehicle } from "@/lib/adminApi";

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

const EMPTY: Partial<GpsDevice> = { name: "", sim_number: "", model: "", imei: "", vehicle_id: "", notes: "" };

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "#e8232a", textTransform: "uppercase", margin: "0 0 4px" }}>GPS Control EC</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.6px", margin: 0 }}>Dispositivos GPS</h1>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>{devices.length} dispositivos registrados · números SIM</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo dispositivo</button>
      </div>

      {loading ? (
        <div style={{ height: 200, borderRadius: 16, background: "rgba(255,255,255,0.03)", animation: "shimmer 1.5s infinite" }}/>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(20px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["Nombre","Número SIM","Modelo / IMEI","Vehículo","Cliente",""].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {devices.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,0.2)", padding: 40 }}>Sin dispositivos. Agrega el primero.</td></tr>
              ) : devices.map(d => (
                <tr key={d.id}>
                  <td style={S.td}><div style={{ fontWeight: 700, color: "#fff" }}>{d.name}</div></td>
                  <td style={S.td}><span style={{ fontFamily: "monospace", color: "#e8232a", fontWeight: 700 }}>{d.sim_number}</span></td>
                  <td style={S.td}>
                    <div style={{ color: "rgba(255,255,255,0.6)" }}>{d.model || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</div>
                    {d.imei && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: "monospace" }}>{d.imei}</div>}
                  </td>
                  <td style={S.td}>{d.vehicle_name || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                  <td style={S.td}>
                    {d.client_name
                      ? <><div style={{ fontWeight: 600, fontSize: 12 }}>{d.client_name}</div><div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>@{d.username}</div></>
                      : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                  </td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    <button style={{ ...S.btnGhost, marginRight: 6 }} onClick={() => openEdit(d)}>Editar</button>
                    <button style={{ ...S.btnGhost, color: "#f87171" }} onClick={() => { if(confirm(`¿Eliminar "${d.name}"?`)) adminApi.deleteDevice(d.id).then(load); }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={close}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 460, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.4px" }}>{modal === "create" ? "Nuevo dispositivo GPS" : "Editar dispositivo"}</h2>
            {error && <div style={S.errBox}>{error}</div>}
            <div style={S.field}><label style={S.label}>Nombre</label><input style={S.input} value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="GPS Vehículo 01"/></div>
            <div style={{ ...S.field, background: "rgba(232,35,42,0.05)", border: "1px solid rgba(232,35,42,0.15)", borderRadius: 10, padding: 14 }}>
              <label style={{ ...S.label, color: "#e8232a" }}>Número SIM del GPS</label>
              <input style={{ ...S.input, fontFamily: "monospace", fontSize: 15, fontWeight: 700 }} value={form.sim_number||""} onChange={e=>set("sim_number",e.target.value)} placeholder="+5930991234567"/>
              <p style={{ color: "rgba(232,35,42,0.5)", fontSize: 11, margin: "6px 0 0" }}>Recibe los comandos SMS. Nunca visible para el cliente.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
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