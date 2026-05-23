"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient, GpsDevice, Vehicle } from "@/lib/adminApi";

const S = {
  page:     { padding: "28px 32px", color: "#f0f6ff", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: "#0a0a0a", minHeight: "100vh" } as React.CSSProperties,
  label:    { display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6 } as React.CSSProperties,
  input:    { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  select:   { width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  btnRed:   { padding: "11px 22px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.2px" } as React.CSSProperties,
  btnGhost: { padding: "7px 14px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  field:    { marginBottom: 16 } as React.CSSProperties,
  errBox:   { padding: "10px 14px", background: "rgba(232,35,42,0.08)", border: "1px solid rgba(232,35,42,0.25)", borderRadius: 8, color: "#ff6b6b", fontSize: 13, marginBottom: 14 } as React.CSSProperties,
};

const EMPTY: Partial<AppClient> = { username: "", password: "", client_name: "", email: "", phone: "", vehicle_id: "", gps_device_id: "" };

function HoverRow({ children }: { children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "rgba(255,255,255,0.03)" : "transparent", transition: "background 0.15s" }}>
      {children}
    </tr>
  );
}

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

  const COLS = ["Cliente", "Credenciales", "Vehículo", "GPS / SIM", "Estado", ""];

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "#e8232a", textTransform: "uppercase", margin: "0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 6px", color: "#fff" }}>Clientes</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>{clients.length} clientes registrados · usuarios de la app móvil</p>
        </div>
        <button style={S.btnRed} onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 64, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "shimmer 1.5s infinite" }}/>)}
        </div>
      ) : clients.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          Sin clientes. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 100px 160px", padding: "12px 20px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {COLS.map(c => (
              <div key={c} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{c}</div>
            ))}
          </div>

          {/* Rows */}
          {clients.map((c, idx) => (
            <div key={c.id} style={{
              display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 100px 160px",
              padding: "16px 20px", alignItems: "center",
              borderBottom: idx < clients.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Cliente */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: "-0.2px" }}>{c.client_name}</div>
                {c.email && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>{c.email}</div>}
              </div>

              {/* Credenciales */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 5, width: "fit-content" }}>{c.username}</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "2px 8px" }}>{c.password}</span>
              </div>

              {/* Vehículo */}
              <div style={{ fontSize: 13, color: c.vehicle_name ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}>
                {c.vehicle_name || "—"}
              </div>

              {/* GPS / SIM */}
              <div>
                {c.device_name ? (
                  <>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{c.device_name}</div>
                    <div style={{ fontFamily: "monospace", color: "#e8232a", fontSize: 12, marginTop: 2 }}>{c.sim_number}</div>
                  </>
                ) : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>—</span>}
              </div>

              {/* Estado */}
              <div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: c.active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${c.active ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`,
                  color: c.active ? "#4ade80" : "rgba(255,255,255,0.3)",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.active ? "#22c55e" : "rgba(255,255,255,0.2)" }}/>
                  {c.active ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", gap: 6 }}>
                <button style={S.btnGhost} onClick={() => openEdit(c)}>Editar</button>
                <button style={{ ...S.btnGhost, color: c.active ? "#f87171" : "#4ade80", borderColor: c.active ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.2)" }}
                  onClick={() => adminApi.toggleClient(c.id).then(load)}>
                  {c.active ? "Off" : "On"}
                </button>
                <button style={{ ...S.btnGhost, color: "#f87171", borderColor: "rgba(248,113,113,0.15)", padding: "7px 10px" }}
                  onClick={() => { if(confirm(`¿Eliminar "${c.client_name}"?`)) adminApi.deleteClient(c.id).then(load); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={close}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 480, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>{modal === "create" ? "Nuevo cliente" : "Editar cliente"}</h2>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 24 }}>Los datos se guardan en el servidor automáticamente.</p>
            {error && <div style={S.errBox}>{error}</div>}

            <div style={S.field}><label style={S.label}>Nombre del cliente</label><input style={S.input} value={form.client_name||""} onChange={e=>set("client_name",e.target.value)} placeholder="Transportes Pérez S.A."/></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={S.label}>Usuario app</label><input style={S.input} value={form.username||""} onChange={e=>set("username",e.target.value)} placeholder="juan.perez"/></div>
              <div><label style={S.label}>Contraseña app</label><input style={S.input} value={form.password||""} onChange={e=>set("password",e.target.value)} placeholder="****"/></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={S.label}>Email</label><input style={S.input} value={form.email||""} onChange={e=>set("email",e.target.value)}/></div>
              <div><label style={S.label}>Teléfono</label><input style={S.input} value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div>
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