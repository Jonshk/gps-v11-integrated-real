"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { adminApi, AppClient } from "@/lib/adminApi";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
const authHeaders = () => ({ "Content-Type": "application/json", "x-admin-token": getToken() || "" });

async function sendCommand(clientId: string, command: string) {
  const res = await fetch(`${BASE}/admin/gateway/send`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ client_id: clientId, command }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Error");
  return data;
}

const COMMAND_GROUPS = [
  {
    id: "location", label: "Localización",
    commands: [
      { key: "locate",     label: "Localizar",        sub: "tracker + check", color: "#10b981", dot: "#34d399" },
      { key: "live_track", label: "Tracking en vivo", sub: "fix030s999n",     color: "#3b82f6", dot: "#60a5fa" },
      { key: "stop_track", label: "Parar tracking",   sub: "nofix",           color: "#6b7280", dot: "#9ca3af" },
    ]
  },
  {
    id: "engine", label: "Motor",
    commands: [
      { key: "stop_engine",  label: "Apagar motor",   sub: "stopelec",   color: "#ef4444", dot: "#f87171" },
      { key: "start_engine", label: "Encender motor", sub: "supplyelec", color: "#10b981", dot: "#34d399" },
    ]
  },
  {
    id: "alerts", label: "Alertas",
    commands: [
      { key: "move_alert",  label: "Alerta mov.",   sub: "move",      color: "#f59e0b", dot: "#fbbf24" },
      { key: "speed_alert", label: "Vel. excesiva", sub: "speed 080", color: "#f97316", dot: "#fb923c" },
      { key: "no_speed",    label: "Desact. vel.",  sub: "nospeed",   color: "#6b7280", dot: "#9ca3af" },
    ]
  },
  {
    id: "info", label: "Audio e info",
    commands: [
      { key: "monitor", label: "Micrófono",   sub: "monitor + llamada", color: "#8b5cf6", dot: "#a78bfa", callAfter: true },
      { key: "status",  label: "Estado GPS",  sub: "status",            color: "#3b82f6", dot: "#60a5fa" },
      { key: "battery", label: "Batería",     sub: "battery",           color: "#10b981", dot: "#34d399" },
      { key: "reset",   label: "Reiniciar",   sub: "reset",             color: "#f97316", dot: "#fb923c" },
    ]
  },
];

type Msg = {
  id: number; from_number: string; body: string; received_at: string;
  parsed_type: string; label: string; icon: string;
  lat: number | null; lng: number | null; speed: number | null; battery: number | null;
};
type Pos = { lat: number; lng: number; speed: number | null; battery: number | null; recorded_at: string; };
type LogEntry = { text: string; ok: boolean; time: string; };

export default function ComandosPage() {
  const [clients, setClients]     = useState<AppClient[]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [sending, setSending]     = useState<string | null>(null);
  const [messages, setMessages]   = useState<Msg[]>([]);
  const [position, setPosition]   = useState<Pos | null>(null);
  const [log, setLog]             = useState<LogEntry[]>([]);
  const [callAlert, setCallAlert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "responses">("map");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const clientsWithGps = useMemo(() => clients.filter(c => c.sim_number), [clients]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clientsWithGps;
    const q = search.toLowerCase();
    return clientsWithGps.filter(c =>
      c.client_name.toLowerCase().includes(q) ||
      (c.vehicle_name || "").toLowerCase().includes(q) ||
      (c.username || "").toLowerCase().includes(q) ||
      (c.sim_number || "").includes(q)
    );
  }, [clientsWithGps, search]);

  const sel = clientsWithGps.find(c => c.id === selected) ?? clientsWithGps[0];

  useEffect(() => {
    adminApi.getClients().then(c => { setClients(c); setLoading(false); });
  }, []);

  const loadData = useCallback(async () => {
    if (!sel) return;
    try {
      const [msgs, pos] = await Promise.all([
        fetch(`${BASE}/admin/gps-messages?limit=20`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
        fetch(`${BASE}/admin/live/${sel.id}`, { headers: authHeaders() }).then(r => r.ok ? r.json() : null),
      ]);
      setMessages(msgs);
      if (pos?.ok) setPosition(pos);
    } catch (_) {}
  }, [sel?.id]);

  useEffect(() => {
    if (!sel) return;
    loadData();
    pollRef.current = setInterval(loadData, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sel?.id, loadData]);

  async function handleCmd(key: string, callAfter = false) {
    if (!sel) return;
    setSending(key);
    try {
      const res = await sendCommand(sel.id, key);
      setLog(p => [{ text: res.label || key, ok: true, time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) }, ...p.slice(0, 14)]);
      if (callAfter || res.call_after) setCallAlert(sel.sim_number || "");
    } catch (e: unknown) {
      setLog(p => [{ text: e instanceof Error ? e.message : "Error", ok: false, time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) }, ...p.slice(0, 14)]);
    } finally { setSending(null); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080f1a", fontFamily: "'Geist', 'Plus Jakarta Sans', system-ui, sans-serif", color: "#e2e8f0", display: "grid", gridTemplateColumns: "280px 1fr" }}>

      {/* Call alert */}
      {callAlert && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", alignItems: "center", gap: 12, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)", backdropFilter: "blur(20px)", borderRadius: 14, padding: "12px 20px", boxShadow: "0 8px 32px rgba(139,92,246,0.2)", animation: "slideDown 0.4s cubic-bezier(0.32,0.72,0,1)", maxWidth: "90vw" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 8px #a78bfa", animation: "pulse 1.5s infinite", flexShrink: 0 }}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#c4b5fd" }}>Micrófono activado</div>
            <div style={{ fontSize: 11, color: "rgba(196,181,253,0.6)", marginTop: 1 }}>Llama al GPS: <strong style={{ fontFamily: "monospace" }}>{callAlert}</strong></div>
          </div>
          <a href={`tel:${callAlert}`} style={{ padding: "6px 14px", background: "#7c3aed", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>Llamar</a>
          <button onClick={() => setCallAlert(null)} style={{ background: "none", border: "none", color: "rgba(196,181,253,0.4)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside style={{ borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>

        {/* Header sidebar */}
        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(148,163,184,0.4)", textTransform: "uppercase", marginBottom: 2 }}>Panel GPS</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.4px" }}>Comandos SMS</div>
        </div>

        {/* Buscador */}
        <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(148,163,184,0.4)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente, vehículo, SIM..."
              style={{
                width: "100%", padding: "8px 10px 8px 30px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 9, color: "#e2e8f0", fontSize: 12,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.35)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(148,163,184,0.4)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          {/* Contador */}
          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(148,163,184,0.35)", paddingLeft: 2 }}>
            {search ? `${filteredClients.length} de ${clientsWithGps.length} clientes` : `${clientsWithGps.length} clientes con GPS`}
          </div>
        </div>

        {/* Lista scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 16px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 4px" }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ height: 54, borderRadius: 10, background: "rgba(255,255,255,0.03)", animation: `shimmer ${1.2 + i * 0.1}s infinite` }}/>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: "24px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,0.4)" }}>Sin resultados para "{search}"</div>
            </div>
          ) : filteredClients.map(c => {
            const isActive = c.id === (selected ?? clientsWithGps[0]?.id);
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} style={{
                width: "100%", padding: "9px 10px", marginBottom: 3,
                background: isActive ? "rgba(16,185,129,0.07)" : "transparent",
                border: `1px solid ${isActive ? "rgba(16,185,129,0.18)" : "transparent"}`,
                borderRadius: 10, cursor: "pointer", textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: isActive ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={isActive ? "#10b981" : "rgba(148,163,184,0.4)"}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#f1f5f9" : "#94a3b8", letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.client_name}</div>
                    <div style={{ fontSize: 10, color: "rgba(148,163,184,0.4)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.vehicle_name || "Sin vehículo"}</div>
                  </div>
                  {isActive && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px #10b981", flexShrink: 0 }}/>}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main style={{ padding: "22px 24px", overflow: "auto" }}>
        {sel ? (
          <div style={{ maxWidth: 860 }}>

            {/* Client header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", marginBottom: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.4px" }}>{sel.client_name}</div>
                <div style={{ fontSize: 11, color: "rgba(148,163,184,0.45)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sel.vehicle_name} · @{sel.username}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {position && (
                  <div style={{ padding: "4px 10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 7, fontSize: 11, color: "#34d399", display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }}/>
                    {position.speed ? `${Math.round(position.speed)} km/h` : "En vivo"}
                    {position.battery !== null && position.battery !== undefined ? ` · ${position.battery}%` : ""}
                  </div>
                )}
                <div style={{ padding: "4px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, fontSize: 10, color: "rgba(148,163,184,0.5)", fontFamily: "monospace" }}>
                  {sel.sim_number}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 3, marginBottom: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: 3, width: "fit-content" }}>
              {(["map", "responses"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: activeTab === tab ? "rgba(255,255,255,0.07)" : "transparent",
                  color: activeTab === tab ? "#f1f5f9" : "rgba(148,163,184,0.4)",
                  transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
                }}>
                  {tab === "map" ? "Mapa" : `Respuestas${messages.length > 0 ? ` (${messages.length})` : ""}`}
                </button>
              ))}
            </div>

            {/* Map */}
            {activeTab === "map" && (
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", height: 240, marginBottom: 16, background: "#0d1829" }}>
                {position ? (
                  <iframe key={`${position.lat}-${position.lng}`}
                    src={`https://maps.google.com/maps?q=${position.lat},${position.lng}&z=15&output=embed`}
                    width="100%" height="100%" style={{ border: "none", display: "block" }} title="GPS"/>
                ) : (
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(148,163,184,0.25)">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(148,163,184,0.35)" }}>Sin posición registrada</div>
                    <div style={{ fontSize: 10, color: "rgba(148,163,184,0.2)" }}>Envía "Localizar" para obtener coordenadas</div>
                  </div>
                )}
              </div>
            )}

            {/* Responses */}
            {activeTab === "responses" && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
                <div style={{ padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", position: "sticky", top: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(148,163,184,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Respuestas del GPS · cada 5s
                  </span>
                  <button onClick={async () => { await fetch(`${BASE}/admin/gps-messages`, { method: "DELETE", headers: authHeaders() }); setMessages([]); }}
                    style={{ background: "none", border: "none", color: "rgba(148,163,184,0.3)", cursor: "pointer", fontSize: 11 }}>Limpiar</button>
                </div>
                {messages.length === 0 ? (
                  <div style={{ padding: "24px 14px", textAlign: "center", color: "rgba(148,163,184,0.3)", fontSize: 12 }}>Esperando respuestas del GPS...</div>
                ) : messages.map(msg => (
                  <div key={msg.id} style={{ padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 15, lineHeight: 1.3, flexShrink: 0 }}>{msg.icon || "💬"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{msg.label || msg.parsed_type}</span>
                        <span style={{ fontSize: 10, color: "rgba(148,163,184,0.3)" }}>{new Date(msg.received_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(148,163,184,0.4)", fontFamily: "monospace", wordBreak: "break-all", marginBottom: msg.lat ? 6 : 0 }}>{msg.body}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                        {msg.battery !== null && msg.battery !== undefined && <span style={{ fontSize: 10, color: "#34d399" }}>Batería: {msg.battery}%</span>}
                        {msg.speed !== null && msg.speed !== undefined && <span style={{ fontSize: 10, color: "#60a5fa" }}>{Math.round(msg.speed)} km/h</span>}
                        {msg.lat && msg.lng && (
                          <a href={`https://maps.google.com/maps?q=${msg.lat},${msg.lng}`} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", color: "#34d399", fontSize: 10, fontWeight: 600, textDecoration: "none" }}>
                            Ver en mapa · {msg.lat.toFixed(4)}, {msg.lng.toFixed(4)}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Command groups — grid 2x2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {COMMAND_GROUPS.map(group => (
                <div key={group.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(148,163,184,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{group.label}</span>
                  </div>
                  <div style={{ padding: "8px 8px", display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                    {group.commands.map((cmd: any) => {
                      const isSending = sending === cmd.key;
                      return (
                        <button key={cmd.key} disabled={!!sending} onClick={() => handleCmd(cmd.key, cmd.callAfter)}
                          style={{
                            padding: "7px 12px", borderRadius: 8,
                            background: isSending ? `${cmd.color}15` : `${cmd.color}0d`,
                            border: `1px solid ${cmd.color}${isSending ? "35" : "18"}`,
                            cursor: sending && !isSending ? "not-allowed" : "pointer",
                            opacity: sending && !isSending ? 0.3 : 1,
                            display: "flex", alignItems: "center", gap: 7,
                            transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
                            transform: isSending ? "scale(0.96)" : "scale(1)",
                          }}>
                          {isSending ? (
                            <div style={{ width: 10, height: 10, border: `1.5px solid ${cmd.color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }}/>
                          ) : (
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: cmd.dot, boxShadow: `0 0 4px ${cmd.dot}`, flexShrink: 0 }}/>
                          )}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: cmd.color, letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>{cmd.label}</div>
                            <div style={{ fontSize: 9, color: "rgba(148,163,184,0.3)", fontFamily: "monospace", marginTop: 1 }}>{cmd.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Activity log */}
            {log.length > 0 && (
              <div style={{ marginTop: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(148,163,184,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Actividad reciente</span>
                  <button onClick={() => setLog([])} style={{ background: "none", border: "none", color: "rgba(148,163,184,0.25)", cursor: "pointer", fontSize: 11 }}>Limpiar</button>
                </div>
                {log.map((l, i) => (
                  <div key={i} style={{ padding: "7px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: l.ok ? "#10b981" : "#ef4444", flexShrink: 0 }}/>
                    <span style={{ flex: 1, fontSize: 11, color: l.ok ? "#86efac" : "#fca5a5" }}>{l.ok ? "Encolado: " : "Error: "}{l.text}</span>
                    <span style={{ fontSize: 10, color: "rgba(148,163,184,0.2)", fontFamily: "monospace" }}>{l.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(148,163,184,0.25)">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, color: "rgba(148,163,184,0.35)" }}>Selecciona un cliente para comenzar</div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
        @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}