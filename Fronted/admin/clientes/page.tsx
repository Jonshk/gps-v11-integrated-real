"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient, GpsDevice, Vehicle } from "@/lib/adminApi";

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
  badge: (active: number) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
    background: active ? "rgba(0,212,160,0.1)" : "rgba(248,113,113,0.1)",
    color: active ? "#00d4a0" : "#f87171",
    border: `1px solid ${active ? "rgba(0,212,160,0.2)" : "rgba(248,113,113,0.2)"}`,
  }),
  overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#0f1f36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "32px", width: 480, maxHeight: "90vh", overflowY: "auto" as const },
  label: { display: "block", color: "rgba(200,218,238,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, marginBottom: 6 } as React.CSSProperties,
  input: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  select: { width: "100%", padding: "11px 14px", background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  field: { marginBottom: 16 } as React.CSSProperties,
  errBox: { padding: "10px 14px", background: "rgba(232,35,42,0.08)", border: "1px solid rgba(232,35,42,0.2)", borderRadius: 8, color: "#e8232a", fontSize: 13, marginBottom: 16 } as React.CSSProperties,
};

const EMPTY: Partial<AppClient> = { username: "", password: "", client_name: "", email: "", phone: "", vehicle_id: "", gps_device_id: "" };

export default function ClientesPage() {
  const [clients, setClients]     = useState<AppClient[]>([]);
  const [devices, setDevices]     = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<"create" | "edit" | null>(null);
  const [form, setForm]           = useState<Partial<AppClient>>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  async function load() {
    setLoading(true);
    try {
      const [c, d, v] = await Promise.all([adminApi.getClients(), adminApi.getDevices(), adminApi.getVehicles()]);
      setClients(c); setDevices(d); setVehicles(v);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(c: AppClient) { setForm({ ...c }); setError(""); setModal("edit"); }
  function closeModal() { setModal(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (modal === "create") await adminApi.createClient(form);
      else await adminApi.updateClient(form.id!, form);
      await load(); closeModal();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function toggle(c: AppClient) {
    await adminApi.toggleClient(c.id);
    await load();
  }

  async function remove(c: AppClient) {
    if (!confirm(`¿Eliminar cliente "${c.client_name}"?`)) return;
    await adminApi.deleteClient(c.id);
    await load();
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Clientes</h1>
          <p style={S.sub}>{clients.length} clientes registrados · usuarios de la app móvil</p>
        </div>
        <button style={S.btnPrimary} onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      {loading ? (
        <p style={{ color: "rgba(200,218,238,0.4)", fontSize: 14 }}>Cargando...</p>
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Cliente", "Usuario", "Contraseña", "Vehículo", "GPS / SIM", "Estado", ""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "rgba(200,218,238,0.3)", padding: 40 }}>
                  Sin clientes. Crea el primero.
                </td></tr>
              ) : clients.map(c => (
                <tr key={c.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{c.client_name}</div>
                    {c.email && <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 11, marginTop: 2 }}>{c.email}</div>}
                    {c.phone && <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 11 }}>{c.phone}</div>}
                  </td>
                  <td style={{ ...S.td, fontFamily: "monospace" }}>{c.username}</td>
                  <td style={{ ...S.td, fontFamily: "monospace", color: "rgba(200,218,238,0.5)" }}>{c.password}</td>
                  <td style={S.td}>{c.vehicle_name || <span style={{ color: "rgba(200,218,238,0.3)" }}>—</span>}</td>
                  <td style={S.td}>
                    {c.device_name
                      ? <><div style={{ fontWeight: 500 }}>{c.device_name}</div>
                          <div style={{ fontFamily: "monospace", color: "#00d4a0", fontSize: 12 }}>{c.sim_number}</div></>
                      : <span style={{ color: "rgba(200,218,238,0.3)" }}>Sin asignar</span>
                    }
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(c.active)}>{c.active ? "Activo" : "Inactivo"}</span>
                  </td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    <button style={{ ...S.btnGhost, marginRight: 6 }} onClick={() => openEdit(c)}>Editar</button>
                    <button style={{ ...S.btnGhost, marginRight: 6, color: c.active ? "#f87171" : "#00d4a0" }} onClick={() => toggle(c)}>
                      {c.active ? "Desactivar" : "Activar"}
                    </button>
                    <button style={{ ...S.btnGhost, color: "#f87171" }} onClick={() => remove(c)}>Eliminar</button>
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
              {modal === "create" ? "Nuevo cliente" : "Editar cliente"}
            </h2>

            {error && <div style={S.errBox}>{error}</div>}

            <div style={S.field}>
              <label style={S.label}>NOMBRE DEL CLIENTE</label>
              <input style={S.input} value={form.client_name || ""} onChange={e => set("client_name", e.target.value)} placeholder="Transportes Pérez S.A."/>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>USUARIO APP</label>
                <input style={S.input} value={form.username || ""} onChange={e => set("username", e.target.value)} placeholder="juan.perez"/>
              </div>
              <div>
                <label style={S.label}>CONTRASEÑA APP</label>
                <input style={S.input} value={form.password || ""} onChange={e => set("password", e.target.value)} placeholder="****"/>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>EMAIL</label>
                <input style={S.input} value={form.email || ""} onChange={e => set("email", e.target.value)} placeholder="cliente@mail.com"/>
              </div>
              <div>
                <label style={S.label}>TELÉFONO</label>
                <input style={S.input} value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="0991234567"/>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>VEHÍCULO ASIGNADO</label>
              <select style={S.select} value={form.vehicle_id || ""} onChange={e => set("vehicle_id", e.target.value)}>
                <option value="">— Sin vehículo —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>DISPOSITIVO GPS (SIM)</label>
              <select style={S.select} value={form.gps_device_id || ""} onChange={e => set("gps_device_id", e.target.value)}>
                <option value="">— Sin GPS asignado —</option>
                {devices.filter(d => d.active).map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.sim_number}</option>
                ))}
              </select>
              {form.gps_device_id && (
                <div style={{ marginTop: 6, padding: "8px 12px", background: "rgba(0,212,160,0.08)", borderRadius: 8, fontSize: 12, color: "#00d4a0" }}>
                  SIM: {devices.find(d => d.id === form.gps_device_id)?.sim_number || "—"}
                  &nbsp;· Los SMS irán a este número
                </div>
              )}
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
