"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient, GpsDevice, Vehicle } from "@/lib/adminApi";

export default function AsignacionesPage() {
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [devices, setDevices]   = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [msg, setMsg]           = useState("");

  async function load() {
    setLoading(true);
    try {
      const [c, d, v] = await Promise.all([adminApi.getClients(), adminApi.getDevices(), adminApi.getVehicles()]);
      setClients(c); setDevices(d); setVehicles(v);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function assign(clientId: string, field: "vehicle_id" | "gps_device_id", value: string) {
    setSaving(clientId + field);
    try {
      await adminApi.updateClient(clientId, { [field]: value || undefined });
      setMsg("✓ Guardado");
      setTimeout(() => setMsg(""), 2500);
      await load();
    } finally { setSaving(null); }
  }

  const td: React.CSSProperties = { padding: "16px 18px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" };
  const th: React.CSSProperties = { padding: "12px 18px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(200,218,238,0.35)", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)" };
  const sel: React.CSSProperties = { padding: "8px 12px", background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f6ff", fontSize: 13, width: "100%", outline: "none" };

  return (
    <div style={{ padding: "32px 36px", fontFamily: "Inter, system-ui, sans-serif", color: "#f0f6ff" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8 }}>Asignaciones</h1>
        <p style={{ color: "rgba(200,218,238,0.45)", fontSize: 13, marginTop: 4 }}>
          Asigna vehículo y dispositivo GPS a cada cliente desde aquí.
        </p>
      </div>

      {/* Flujo visual */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 16, marginBottom: 32,
      }}>
        {[
          { num: "1", title: "Crea el dispositivo GPS", sub: "Registra el número SIM en «Dispositivos»", color: "#e8232a" },
          { num: "2", title: "Crea el cliente", sub: "Define usuario y contraseña en «Clientes»", color: "#00d4a0" },
          { num: "3", title: "Asigna aquí", sub: "Vincula cliente → vehículo → GPS en esta tabla", color: "#60a5fa" },
        ].map(s => (
          <div key={s.num} style={{
            padding: "20px", background: "#0f1f36",
            border: `1px solid ${s.color}22`,
            borderRadius: 14,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${s.color}15`, border: `1px solid ${s.color}33`, display: "grid", placeItems: "center", marginBottom: 12 }}>
              <span style={{ color: s.color, fontWeight: 800, fontSize: 14 }}>{s.num}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
            <div style={{ color: "rgba(200,218,238,0.45)", fontSize: 12, lineHeight: 1.5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{
          marginBottom: 16, padding: "10px 16px",
          background: "rgba(0,212,160,0.08)", border: "1px solid rgba(0,212,160,0.2)",
          borderRadius: 8, color: "#00d4a0", fontSize: 13,
        }}>{msg}</div>
      )}

      {loading ? (
        <p style={{ color: "rgba(200,218,238,0.4)" }}>Cargando...</p>
      ) : (
        <div style={{ background: "#0f1f36", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Cliente", "Vehículo", "Dispositivo GPS / SIM", "Estado app"].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "rgba(200,218,238,0.3)", padding: 48 }}>
                  Sin clientes. Crea uno primero en «Clientes».
                </td></tr>
              ) : clients.map(c => {
                const simNumber = devices.find(d => d.id === c.gps_device_id)?.sim_number;
                const ready = Boolean(c.vehicle_id && c.gps_device_id);
                return (
                  <tr key={c.id}>
                    {/* Cliente */}
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{c.client_name}</div>
                      <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>
                        @{c.username}
                      </div>
                    </td>

                    {/* Select vehículo */}
                    <td style={{ ...td, minWidth: 180 }}>
                      <select
                        style={sel}
                        value={c.vehicle_id || ""}
                        disabled={saving === c.id + "vehicle_id"}
                        onChange={e => assign(c.id, "vehicle_id", e.target.value)}
                      >
                        <option value="">— Sin vehículo —</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </td>

                    {/* Select GPS */}
                    <td style={{ ...td, minWidth: 220 }}>
                      <select
                        style={sel}
                        value={c.gps_device_id || ""}
                        disabled={saving === c.id + "gps_device_id"}
                        onChange={e => assign(c.id, "gps_device_id", e.target.value)}
                      >
                        <option value="">— Sin GPS —</option>
                        {devices.filter(d => d.active).map(d => (
                          <option key={d.id} value={d.id}>{d.name} · {d.sim_number}</option>
                        ))}
                      </select>
                      {simNumber && (
                        <div style={{ marginTop: 6, fontSize: 11, fontFamily: "monospace", color: "#00d4a0" }}>
                          📡 SMS → {simNumber}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td style={td}>
                      {ready ? (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "4px 10px", borderRadius: 999,
                          background: "rgba(0,212,160,0.1)",
                          border: "1px solid rgba(0,212,160,0.2)",
                          color: "#00d4a0", fontSize: 11, fontWeight: 700,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4a0" }}/>
                          Listo para la app
                        </div>
                      ) : (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "4px 10px", borderRadius: 999,
                          background: "rgba(251,191,36,0.08)",
                          border: "1px solid rgba(251,191,36,0.2)",
                          color: "#fbbf24", fontSize: 11, fontWeight: 700,
                        }}>
                          ⚠ Asignación incompleta
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
