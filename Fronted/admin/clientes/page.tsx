"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient, GpsDevice, Vehicle } from "@/lib/adminApi";

const glass = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: 16,
  boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
};

const S = {
  page:     { padding: "28px 32px", color: "#1a1a2e", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: "#f0f2f5", minHeight: "100vh" } as React.CSSProperties,
  label:    { display: "block", color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  input:    { width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: "#1a1a2e", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  select:   { width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: "#1a1a2e", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  btnRed:   { padding: "10px 22px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(232,35,42,0.25)" } as React.CSSProperties,
  btnGhost: { padding: "7px 14px", background: "transparent", color: "#6b7280", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  field:    { marginBottom: 16 } as React.CSSProperties,
  errBox:   { padding: "10px 14px", background: "rgba(232,35,42,0.05)", border: "1px solid rgba(232,35,42,0.15)", borderRadius: 8, color: "#e8232a", fontSize: 13, marginBottom: 14 } as React.CSSProperties,
};

const EMPTY: Partial<AppClient> = { username: "", password: "", client_name: "", email: "", phone: "", vehicle_id: "", gps_device_id: "" };

export default function ClientesPage() {
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create" | "edit" | null>(null);
  const [form, setForm]         = useState<Partial<AppClient>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

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

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const COLS = ["Cliente", "Credenciales", "Vehículo", "GPS / SIM", "Estado", ""];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "#e8232a", textTransform: "uppercase", margin: "0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 4px", color: "#1a1a2e" }}>Clientes</h1>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>{clients.length} clientes registrados · usuarios de la app móvil</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      {loading ? (
        <div style={{ ...glass, padding: 24 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 60, borderRadius: 10, background: "rgba(0,0,0,0.04)", marginBottom: 8, animation: "shimmer 1.5s infinite" }} />)}
        </div>
      ) : clients.length === 0 ? (
        <div style={{ ...glass, padding: "60px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
          Sin clientes. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <div style={{ ...glass, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 100px 160px", padding: "12px 20px", background: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {COLS.map(c => (
              <div key={c} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>{c}</div>
            ))}
          </div>

          {/* Rows */}
          {clients.map((c, idx) => (
            <div key={c.id} style={{
              display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 100px 160px",
              padding: "16px 20px", alignItems: "center",
              borderBottom: idx < clients.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Cliente */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{c.client_name}</div>
                {c.email && <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 3 }}>{c.email}</div>}
              </div>

              {/* Credenciales */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontFamily: "monospace", fontSize: 13, color: "#374151", background: "rgba(0,0,0,0.05)", padding: "2px 8px", borderRadius: 5, width: "fit-content" }}>{c.username}</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#9ca3af", padding: "2px 8px" }}>{c.password}</span>
              </div>

              {/* Vehículo */}
              <div style={{ fontSize: 13, color: c.vehicle_name ? "#374151" : "#d1d5db" }}>
                {c.vehicle_name || "—"}
              </div>

              {/* GPS / SIM */}
              <div>
                {c.device_name ? (
                  <>
                    <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{c.device_name}</div>
                    <div style={{ fontFamily: "monospace", color: "#e8232a", fontSize: 12, marginTop: 2 }}>{c.sim_number}</div>
                  </>
                ) : <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>}
              </div>

              {/* Estado */}
              <div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: c.active ? "rgba(34,197,94,0.08)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${c.active ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.1)"}`,
                  color: c.active ? "#16a34a" : "#9ca3af",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.active ? "#22c55e" : "#d1d5db" }} />
                  {c.active ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", gap: 6 }}>
                <button style={S.btnGhost} onClick={() => openEdit(c)}>Editar</button>
                <button style={{ ...S.btnGhost, color: c.active ? "#e8232a" : "#16a34a", borderColor: c.active ? "rgba(232,35,42,0.2)" : "rgba(34,197,94,0.2)" }}
                  onClick={() => adminApi.toggleClient(c.id).then(load)}>
                  {c.active ? "Off" : "On"}
                </button>
                <button style={{ ...S.btnGhost, color: "#e8232a", borderColor: "rgba(232,35,42,0.15)", padding: "7px 10px" }}
                  onClick={() => { if (confirm(`¿Eliminar "${c.client_name}"?`)) adminApi.deleteClient(c.id).then(load); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={close}>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: 32, width: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#1a1a2e", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{modal === "create" ? "Nuevo cliente" : "Editar cliente"}</h2>
            <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 24 }}>Los datos se guardan en el servidor automáticamente.</p>
            {error && <div style={S.errBox}>{error}</div>}

            <div style={S.field}><label style={S.label}>Nombre del cliente</label><input style={S.input} value={form.client_name || ""} onChange={e => set("client_name", e.target.value)} placeholder="Transportes Pérez S.A." /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={S.label}>Usuario app</label><input style={S.input} value={form.username || ""} onChange={e => set("username", e.target.value)} placeholder="juan.perez" /></div>
              <div><label style={S.label}>Contraseña app</label><input style={S.input} value={form.password || ""} onChange={e => set("password", e.target.value)} placeholder="****" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={S.label}>Email</label><input style={S.input} value={form.email || ""} onChange={e => set("email", e.target.value)} /></div>
              <div><label style={S.label}>Teléfono</label><input style={S.input} value={form.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
            </div>
            <div style={S.field}><label style={S.label}>Vehículo asignado</label>
              <select style={S.select} value={form.vehicle_id || ""} onChange={e => set("vehicle_id", e.target.value)}>
                <option value="">— Sin vehículo —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div style={S.field}><label style={S.label}>Dispositivo GPS (SIM)</label>
              <select style={S.select} value={form.gps_device_id || ""} onChange={e => set("gps_device_id", e.target.value)}>
                <option value="">— Sin GPS —</option>
                {devices.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name} · {d.sim_number}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={S.btnGhost} onClick={close}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}
