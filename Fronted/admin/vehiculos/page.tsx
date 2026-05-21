"use client";
import { useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
}

const WRITE_KEY = process.env.NEXT_PUBLIC_API_WRITE_KEY || "changeme123";

async function req(method: string, path: string, body?: unknown) {
  // GET /vehicles es público, POST/PATCH/DELETE requieren x-api-key
  const needsWriteKey = method !== "GET";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(needsWriteKey ? { "x-api-key": WRITE_KEY } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

type Vehicle = {
  id: string;
  name: string;
  status: string;
  lat: number;
  lng: number;
  speed: number;
  geofence?: string;
  updated_at: string;
};

const EMPTY = { name: "", status: "idle", lat: "-2.1704", lng: "-79.8895", geofence: "" };

const S = {
  page: { padding: "32px 36px", color: "#f0f6ff", fontFamily: "Inter, system-ui, sans-serif" } as React.CSSProperties,
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 } as React.CSSProperties,
  title: { fontSize: 24, fontWeight: 800, letterSpacing: -0.8, color: "#f0f6ff" } as React.CSSProperties,
  sub: { color: "rgba(200,218,238,0.45)", fontSize: 13, marginTop: 4 } as React.CSSProperties,
  btnPrimary: { padding: "10px 18px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnGhost: { padding: "8px 14px", background: "transparent", color: "rgba(200,218,238,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  card: { background: "#0f1f36", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" } as React.CSSProperties,
  th: { padding: "12px 16px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "rgba(200,218,238,0.35)", letterSpacing: 1, textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { padding: "14px 16px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const },
  overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#0f1f36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "32px", width: 440 },
  label: { display: "block", color: "rgba(200,218,238,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, marginBottom: 6 } as React.CSSProperties,
  input: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  select: { width: "100%", padding: "11px 14px", background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  field: { marginBottom: 16 } as React.CSSProperties,
  errBox: { padding: "10px 14px", background: "rgba(232,35,42,0.08)", border: "1px solid rgba(232,35,42,0.2)", borderRadius: 8, color: "#e8232a", fontSize: 13, marginBottom: 16 } as React.CSSProperties,
};

const STATUS_COLOR: Record<string, string> = {
  active: "#00d4a0", idle: "#60a5fa", offline: "#f87171",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Activo", idle: "En espera", offline: "Sin señal",
};

export default function VehiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create" | "edit" | null>(null);
  const [form, setForm]         = useState<Record<string, string>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await req("GET", "/vehicles");
      setVehicles(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setError(""); setModal("create"); }
  function openEdit(v: Vehicle) {
    setForm({
      id: v.id, name: v.name, status: v.status,
      lat: String(v.lat), lng: String(v.lng),
      geofence: v.geofence || "",
    });
    setError(""); setModal("edit");
  }
  function closeModal() { setModal(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name,
        status: form.status,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        speed: 0,
        geofence: form.geofence || null,
      };
      if (modal === "create") {
        // Generar id desde el nombre
        const id = "veh-" + form.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 12) + "-" + Date.now().toString(36);
        await req("POST", "/vehicles", { ...payload, id });
      } else {
        await req("PATCH", `/vehicles/${form.id}`, payload);
      }
      await load(); closeModal();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  async function remove(v: Vehicle) {
    if (!confirm(`¿Eliminar vehículo "${v.name}"? Se perderá su historial.`)) return;
    await req("DELETE", `/vehicles/${v.id}`);
    await load();
  }

  const set = (k: string, val: string) => setForm(f => ({ ...f, [k]: val }));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Vehículos</h1>
          <p style={S.sub}>{vehicles.length} vehículos registrados · los carros de tus clientes</p>
        </div>
        <button style={S.btnPrimary} onClick={openCreate}>+ Nuevo vehículo</button>
      </div>

      {/* Info */}
      <div style={{
        marginBottom: 24, padding: "14px 18px",
        background: "rgba(96,165,250,0.06)",
        border: "1px solid rgba(96,165,250,0.15)",
        borderRadius: 12, fontSize: 13,
        color: "rgba(200,218,238,0.6)", lineHeight: 1.6,
      }}>
        🚗 Crea aquí el vehículo de cada cliente antes de asignarle un GPS.
        Las coordenadas iniciales pueden ser las de Guayaquil — se actualizarán solas cuando el GPS reporte posición.
      </div>

      {loading ? (
        <p style={{ color: "rgba(200,218,238,0.4)" }}>Cargando...</p>
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nombre", "Estado", "Posición", "Geocerca", ""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "rgba(200,218,238,0.3)", padding: 48 }}>
                  Sin vehículos. Crea el primero.
                </td></tr>
              ) : vehicles.map(v => (
                <tr key={v.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 700 }}>{v.name}</div>
                    <div style={{ color: "rgba(200,218,238,0.35)", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>{v.id}</div>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: `${STATUS_COLOR[v.status]}15`,
                      border: `1px solid ${STATUS_COLOR[v.status]}30`,
                      color: STATUS_COLOR[v.status],
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[v.status] }}/>
                      {STATUS_LABEL[v.status] || v.status}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "rgba(200,218,238,0.5)" }}>
                    {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                  </td>
                  <td style={S.td}>{v.geofence || <span style={{ color: "rgba(200,218,238,0.3)" }}>—</span>}</td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    <button style={{ ...S.btnGhost, marginRight: 6 }} onClick={() => openEdit(v)}>Editar</button>
                    <button style={{ ...S.btnGhost, color: "#f87171" }} onClick={() => remove(v)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#f0f6ff", fontSize: 18, fontWeight: 800, marginBottom: 24, letterSpacing: -0.5 }}>
              {modal === "create" ? "Nuevo vehículo" : "Editar vehículo"}
            </h2>

            {error && <div style={S.errBox}>{error}</div>}

            <div style={S.field}>
              <label style={S.label}>NOMBRE / PLACA</label>
              <input style={S.input} value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Toyota Hilux — ABC-1234"/>
            </div>

            <div style={S.field}>
              <label style={S.label}>ESTADO INICIAL</label>
              <select style={S.select} value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="idle">En espera</option>
                <option value="active">Activo</option>
                <option value="offline">Sin señal</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>LATITUD INICIAL</label>
                <input style={S.input} value={form.lat} onChange={e => set("lat", e.target.value)}
                  placeholder="-2.1704"/>
              </div>
              <div>
                <label style={S.label}>LONGITUD INICIAL</label>
                <input style={S.input} value={form.lng} onChange={e => set("lng", e.target.value)}
                  placeholder="-79.8895"/>
              </div>
            </div>
            <p style={{ color: "rgba(200,218,238,0.35)", fontSize: 11, marginTop: -10, marginBottom: 16 }}>
              Coordenadas de Guayaquil por defecto — se actualizan solas con el GPS.
            </p>

            <div style={S.field}>
              <label style={S.label}>GEOCERCA (opcional)</label>
              <input style={S.input} value={form.geofence} onChange={e => set("geofence", e.target.value)}
                placeholder="Zona norte, Zona centro..."/>
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
