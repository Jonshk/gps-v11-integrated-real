"use client";
import { useEffect, useState } from "react";
import { adminApi, GpsDevice, Vehicle } from "@/lib/adminApi";

const S = {
  page: { padding: "32px 36px", color: "#f0f6ff" } as React.CSSProperties,
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 } as React.CSSProperties,
  title: { fontSize: 24, fontWeight: 800, letterSpacing: -0.8, color: "#f0f6ff" } as React.CSSProperties,
  sub: { color: "rgba(200,218,238,0.45)", fontSize: 13, marginTop: 4 } as React.CSSProperties,
  btnPrimary: { padding: "10px 18px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnGhost: { padding: "8px 14px", background: "transparent", color: "rgba(200,218,238,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  card: { background: "#0f1f36", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" } as React.CSSProperties,
  th: { padding: "12px 16px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "rgba(200,218,238,0.35)", letterSpacing: 1, textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { padding: "14px 16px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const },
  simBadge: { fontFamily: "monospace", color: "#00d4a0", fontSize: 13, fontWeight: 600 },
  overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#0f1f36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "32px", width: 460, maxHeight: "90vh", overflowY: "auto" as const },
  label: { display: "block", color: "rgba(200,218,238,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, marginBottom: 6 } as React.CSSProperties,
  input: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  select: { width: "100%", padding: "11px 14px", background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  field: { marginBottom: 16 } as React.CSSProperties,
  errBox: { padding: "10px 14px", background: "rgba(232,35,42,0.08)", border: "1px solid rgba(232,35,42,0.2)", borderRadius: 8, color: "#e8232a", fontSize: 13, marginBottom: 16 } as React.CSSProperties,
};

const EMPTY: Partial<GpsDevice> = { name: "", sim_number: "", model: "", imei: "", vehicle_id: "", notes: "" };

export default function DispositivosPage() {
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create" | "edit" | null>(null);
  const [form, setForm]         = useState<Partial<GpsDevice>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    try {
      const [d, v] = await Promise.all([adminApi.getDevices(), adminApi.getVehicles()]);
      setDevices(d); setVehicles(v);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(d: GpsDevice) { setForm({ ...d }); setError(""); setModal("edit"); }
  function closeModal() { setModal(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (modal === "create") await adminApi.createDevice(form);
      else await adminApi.updateDevice(form.id!, form);
      await load(); closeModal();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function remove(d: GpsDevice) {
    if (!confirm(`¿Eliminar dispositivo "${d.name}"?`)) return;
    await adminApi.deleteDevice(d.id);
    await load();
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Dispositivos GPS</h1>
          <p style={S.sub}>{devices.length} dispositivos registrados · números SIM</p>
        </div>
        <button style={S.btnPrimary} onClick={openCreate}>+ Nuevo dispositivo</button>
      </div>

      {/* Info box */}
      <div style={{
        marginBottom: 24, padding: "14px 18px",
        background: "rgba(0,212,160,0.06)",
        border: "1px solid rgba(0,212,160,0.15)",
        borderRadius: 12, fontSize: 13,
        color: "rgba(200,218,238,0.6)", lineHeight: 1.6,
      }}>
        📡 Aquí registras cada GPS físico con su número SIM. Ese número es el que la app usa
        para enviar comandos SMS — el cliente nunca lo ve.
      </div>

      {loading ? (
        <p style={{ color: "rgba(200,218,238,0.4)", fontSize: 14 }}>Cargando...</p>
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nombre", "Número SIM", "Modelo / IMEI", "Vehículo", "Cliente", ""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "rgba(200,218,238,0.3)", padding: 40 }}>
                  Sin dispositivos. Agrega el primero.
                </td></tr>
              ) : devices.map(d => (
                <tr key={d.id}>
                  <td style={S.td}><div style={{ fontWeight: 600 }}>{d.name}</div></td>
                  <td style={S.td}><span style={S.simBadge}>{d.sim_number}</span></td>
                  <td style={S.td}>
                    <div>{d.model || <span style={{ color: "rgba(200,218,238,0.3)" }}>—</span>}</div>
                    {d.imei && <div style={{ color: "rgba(200,218,238,0.35)", fontSize: 11, fontFamily: "monospace" }}>{d.imei}</div>}
                  </td>
                  <td style={S.td}>{d.vehicle_name || <span style={{ color: "rgba(200,218,238,0.3)" }}>—</span>}</td>
                  <td style={S.td}>
                    {d.client_name
                      ? <><div style={{ fontWeight: 500 }}>{d.client_name}</div>
                          <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 11 }}>@{d.username}</div></>
                      : <span style={{ color: "rgba(200,218,238,0.3)" }}>Sin cliente</span>
                    }
                  </td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    <button style={{ ...S.btnGhost, marginRight: 6 }} onClick={() => openEdit(d)}>Editar</button>
                    <button style={{ ...S.btnGhost, color: "#f87171" }} onClick={() => remove(d)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#f0f6ff", fontSize: 18, fontWeight: 800, marginBottom: 24, letterSpacing: -0.5 }}>
              {modal === "create" ? "Nuevo dispositivo GPS" : "Editar dispositivo"}
            </h2>

            {error && <div style={S.errBox}>{error}</div>}

            <div style={S.field}>
              <label style={S.label}>NOMBRE DEL DISPOSITIVO</label>
              <input style={S.input} value={form.name || ""} onChange={e => set("name", e.target.value)} placeholder='GPS Vehículo 01'/>
            </div>
            <div style={{ ...S.field, background: "rgba(0,212,160,0.06)", border: "1px solid rgba(0,212,160,0.15)", borderRadius: 10, padding: 14 }}>
              <label style={{ ...S.label, color: "#00d4a0" }}>NÚMERO SIM DEL GPS ⚠️</label>
              <input style={{ ...S.input, fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}
                value={form.sim_number || ""} onChange={e => set("sim_number", e.target.value)}
                placeholder="0991234567"/>
              <p style={{ color: "rgba(0,212,160,0.6)", fontSize: 11, marginTop: 6 }}>
                Este número recibe los comandos SMS. Nunca visible para el cliente.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>MODELO</label>
                <input style={S.input} value={form.model || ""} onChange={e => set("model", e.target.value)} placeholder="TK103, GT06..."/>
              </div>
              <div>
                <label style={S.label}>IMEI (opcional)</label>
                <input style={S.input} value={form.imei || ""} onChange={e => set("imei", e.target.value)} placeholder="123456789012345"/>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>VEHÍCULO ASOCIADO</label>
              <select style={S.select} value={form.vehicle_id || ""} onChange={e => set("vehicle_id", e.target.value)}>
                <option value="">— Sin vehículo —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>NOTAS</label>
              <input style={S.input} value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Observaciones..."/>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={S.btnGhost} onClick={closeModal}>Cancelar</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
