"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi, AppClient, LogEntry } from "@/lib/adminApi";

const glass = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: 16,
  boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
};

const SOURCE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  admin:   { bg: "rgba(232,35,42,0.08)",  color: "#e8232a",  label: "Admin" },
  app:     { bg: "rgba(59,130,246,0.08)", color: "#3b82f6",  label: "App" },
  gateway: { bg: "rgba(168,85,247,0.08)", color: "#a855f7",  label: "Gateway" },
  system:  { bg: "rgba(107,114,128,0.08)",color: "#6b7280",  label: "Sistema" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  success: { bg: "rgba(34,197,94,0.08)",  color: "#16a34a", dot: "#22c55e" },
  error:   { bg: "rgba(232,35,42,0.08)",  color: "#e8232a", dot: "#e8232a" },
  pending: { bg: "rgba(245,158,11,0.08)", color: "#d97706", dot: "#f59e0b" },
  timeout: { bg: "rgba(249,115,22,0.08)", color: "#ea580c", dot: "#f97316" },
};

const ACTION_ICONS: Record<string, string> = {
  locate:       "📍",
  stop_engine:  "🔴",
  start_engine: "🟢",
  move_alert:   "⚠️",
  speed_alert:  "⚡",
  live_track:   "📡",
  stop_track:   "⏹️",
  monitor:      "🎙️",
  status:       "ℹ️",
  battery:      "🔋",
  reset:        "🔄",
  login:        "🔐",
  logout:       "🚪",
  create:       "➕",
  update:       "✏️",
  delete:       "🗑️",
  toggle:       "🔁",
};

export default function LogsPage() {
  const [logs, setLogs]         = useState<LogEntry[]>([]);
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filtros
  const [filterSource, setFilterSource]   = useState<string>("");
  const [filterClient, setFilterClient]   = useState<string>("");
  const [filterStatus, setFilterStatus]   = useState<string>("");
  const [search, setSearch]               = useState("");

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getLogs({ limit: 200, client_id: filterClient || undefined, source: filterSource || undefined });
      setLogs(data);
    } finally { setLoading(false); }
  }, [filterClient, filterSource]);

  useEffect(() => { adminApi.getClients().then(setClients); }, []);
  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  const filtered = logs.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.actor.toLowerCase().includes(q) ||
        (l.client_name || "").toLowerCase().includes(q) ||
        (l.vehicle_name || "").toLowerCase().includes(q) ||
        l.action_label.toLowerCase().includes(q) ||
        (l.detail || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit" }) + " " +
           d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  // Stats
  const total    = filtered.length;
  const success  = filtered.filter(l => l.status === "success").length;
  const errors   = filtered.filter(l => l.status === "error" || l.status === "timeout").length;
  const pending  = filtered.filter(l => l.status === "pending").length;

  return (
    <div style={{ padding: "28px 32px", background: "#f0f2f5", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "#e8232a", textTransform: "uppercase", margin: "0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.8px", margin: "0 0 4px", color: "#1a1a2e" }}>Logs de actividad</h1>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Historial global — admin, clientes y gateway</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Auto-refresh toggle */}
          <button onClick={() => setAutoRefresh(v => !v)} style={{
            padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: autoRefresh ? "rgba(34,197,94,0.08)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${autoRefresh ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.1)"}`,
            color: autoRefresh ? "#16a34a" : "#6b7280",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: autoRefresh ? "#22c55e" : "#d1d5db", animation: autoRefresh ? "liveDot 2s infinite" : "none", display: "inline-block" }} />
            {autoRefresh ? "En vivo" : "Pausado"}
          </button>
          <button onClick={load} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
            ↻ Actualizar
          </button>
          <button onClick={() => { if (confirm("¿Limpiar todos los logs?")) adminApi.clearLogs().then(load); }} style={{
            padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: "rgba(232,35,42,0.06)", border: "1px solid rgba(232,35,42,0.15)", color: "#e8232a",
          }}>
            🗑 Limpiar logs
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total", value: total, color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.15)" },
          { label: "Exitosos", value: success, color: "#16a34a", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
          { label: "Errores", value: errors, color: "#e8232a", bg: "rgba(232,35,42,0.08)", border: "rgba(232,35,42,0.2)" },
          { label: "Pendientes", value: pending, color: "#d97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ ...glass, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar por actor, acción, detalle..."
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 13, color: "#1a1a2e", outline: "none" }} />

        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          style={{ padding: "8px 12px", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none" }}>
          <option value="">Todas las fuentes</option>
          <option value="admin">Admin</option>
          <option value="app">App móvil</option>
          <option value="gateway">Gateway</option>
          <option value="system">Sistema</option>
        </select>

        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          style={{ padding: "8px 12px", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none" }}>
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "8px 12px", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none" }}>
          <option value="">Todos los estados</option>
          <option value="success">Exitoso</option>
          <option value="error">Error</option>
          <option value="pending">Pendiente</option>
          <option value="timeout">Timeout</option>
        </select>
      </div>

      {/* Tabla de logs */}
      <div style={{ ...glass, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "160px 90px 90px 1fr 1fr 120px 90px", padding: "10px 16px", background: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {["Fecha/Hora", "Fuente", "Estado", "Actor", "Acción", "Vehículo", ""].map(c => (
            <div key={c} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>{c}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 48, borderRadius: 8, background: "rgba(0,0,0,0.04)", marginBottom: 6, animation: "shimmer 1.5s infinite" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            {logs.length === 0 ? "Sin actividad registrada aún." : "Sin resultados para los filtros aplicados."}
          </div>
        ) : (
          <div style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
            {filtered.map((log, idx) => {
              const src = SOURCE_COLORS[log.source] || SOURCE_COLORS.system;
              const st  = STATUS_COLORS[log.status]  || STATUS_COLORS.pending;
              const icon = ACTION_ICONS[log.action] || "💬";

              return (
                <div key={log.id} style={{
                  display: "grid", gridTemplateColumns: "160px 90px 90px 1fr 1fr 120px 90px",
                  padding: "12px 16px", alignItems: "center",
                  borderBottom: idx < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.015)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Fecha */}
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{formatTime(log.timestamp)}</div>

                  {/* Fuente */}
                  <div>
                    <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: src.bg, color: src.color }}>
                      {src.label}
                    </span>
                  </div>

                  {/* Estado */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />
                      {log.status === "success" ? "OK" : log.status === "error" ? "Error" : log.status === "timeout" ? "Timeout" : "Pending"}
                    </span>
                  </div>

                  {/* Actor */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{log.actor}</div>
                    {log.client_name && log.actor !== log.client_name && (
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{log.client_name}</div>
                    )}
                  </div>

                  {/* Acción */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{log.action_label}</div>
                        {log.detail && (
                          <div style={{ fontSize: 10, color: log.status === "error" ? "#e8232a" : "#9ca3af", marginTop: 1, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vehículo */}
                  <div style={{ fontSize: 12, color: log.vehicle_name ? "#374151" : "#d1d5db", fontWeight: log.vehicle_name ? 600 : 400 }}>
                    {log.vehicle_name || "—"}
                  </div>

                  {/* SIM */}
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af" }}>
                    {log.sim_number || ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}
        @keyframes liveDot{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>
    </div>
  );
}
