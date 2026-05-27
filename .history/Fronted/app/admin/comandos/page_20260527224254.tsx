"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { adminApi, AppClient } from "@/lib/adminApi";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
const H = () => ({ "Content-Type": "application/json", "x-admin-token": getToken() || "" });

async function sendCommand(clientId: string, command: string) {
  const res = await fetch(`${BASE}/admin/gateway/send`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ client_id: clientId, command }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Error");
  return data;
}

const ICONS: Record<string, string> = {
  locate:       "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  live_track:   "M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06z",
  stop_track:   "M6 6h12v12H6z",
  stop_engine:  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z",
  start_engine: "M8 5v14l11-7z",
  move_alert:   "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  speed_alert:  "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44z",
  no_speed:     "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z",
  monitor:      "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V21h-2v-3.07z",
  status:       "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  battery:      "M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z",
  reset:        "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
};

type CmdDef = { key: string; label: string; sub: string; color: string; anim: string };

const ALL_COMMANDS: CmdDef[] = [
  { key:"locate",       label:"Localizar",      sub:"check",        color:"#e8232a", anim:"float" },
  { key:"live_track",   label:"Live Tracking",  sub:"fix030s999n",  color:"#e8232a", anim:"spin"  },
  { key:"stop_track",   label:"Parar tracking", sub:"nofix",        color:"#6b7280", anim:"pulse" },
  { key:"stop_engine",  label:"Apagar motor",   sub:"stopelec",     color:"#e8232a", anim:"shake" },
  { key:"start_engine", label:"Encender motor", sub:"supplyelec",   color:"#16a34a", anim:"pulse" },
  { key:"move_alert",   label:"Alerta mov.",    sub:"move",         color:"#d97706", anim:"shake" },
  { key:"speed_alert",  label:"Speed alarm",    sub:"speed 080",    color:"#d97706", anim:"float" },
  { key:"no_speed",     label:"Sin vel.",       sub:"nospeed",      color:"#6b7280", anim:"pulse" },
  { key:"monitor",      label:"Micrófono",      sub:"monitor+call", color:"#7c3aed", anim:"pulse" },
  { key:"status",       label:"Estado GPS",     sub:"status",       color:"#2563eb", anim:"float" },
  { key:"battery",      label:"Batería",        sub:"battery",      color:"#16a34a", anim:"pulse" },
  { key:"reset",        label:"Reiniciar",      sub:"reset",        color:"#ea580c", anim:"spin"  },
];

// Qué tipo de respuesta espera cada comando
const CMD_EXPECTS: Record<string, string[]> = {
  locate:       ["location", "tracker_ok"],
  live_track:   ["live_track_ok", "location"],
  stop_track:   ["unknown"],
  stop_engine:  ["engine_stopped"],
  start_engine: ["engine_started"],
  move_alert:   ["move_alert"],
  speed_alert:  ["speed_alert"],
  no_speed:     ["unknown"],
  monitor:      ["monitor_ok"],
  status:       ["status"],
  battery:      ["battery"],
  reset:        ["reset_ok"],
};

type Msg = { id: number; body: string; received_at: string; label: string; icon: string; lat: number | null; lng: number | null; parsed_type?: string };
type Pos = { lat: number; lng: number; speed: number | null; battery: number | null; recorded_at: string };

// Estado por comando: idle | sending | waiting | answered
type CmdState = "idle" | "sending" | "waiting" | "answered";
type CmdResponse = { label: string; icon: string; body: string; lat?: number | null; lng?: number | null; time: string };

function CommandCard({ cmd, state, response, onSend, disabled }: {
  cmd: CmdDef;
  state: CmdState;
  response: CmdResponse | null;
  onSend: () => void;
  disabled: boolean;
}) {
  const [hov, setHov] = useState(false);
  const isActive = state === "sending" || state === "waiting";
  const hasResp  = state === "answered" && response;

  return (
    <button
      disabled={disabled}
      onClick={onSend}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        padding: hasResp ? "12px 12px 10px" : "14px 12px 12px",
        background: hasResp
          ? `${cmd.color}08`
          : isActive ? `${cmd.color}0f` : hov ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.75)",
        border: `1px solid ${hasResp ? `${cmd.color}35` : isActive ? `${cmd.color}40` : hov ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.07)"}`,
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left", width: "100%",
        transition: "all 0.2s cubic-bezier(0.32,0.72,0,1)",
        transform: hov && !disabled && !isActive ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hasResp
          ? `0 4px 16px ${cmd.color}18`
          : isActive ? `0 4px 16px ${cmd.color}20` : hov ? "0 6px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.05)",
        opacity: disabled && !isActive ? 0.45 : 1,
        overflow: "hidden",
      }}>

      {/* Barra top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: isActive || hasResp || hov ? `linear-gradient(90deg,${cmd.color},transparent)` : "transparent",
        transition: "all 0.3s",
      }} />

      {/* Dot estado */}
      {isActive && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 6, height: 6, borderRadius: "50%",
          background: cmd.color, animation: "liveDot 0.8s infinite",
        }} />
      )}

      {/* Header: icono + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hasResp ? 8 : 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill={isActive || hasResp || hov ? cmd.color : "#9ca3af"}
          style={{
            transition: "all 0.2s", flexShrink: 0,
            filter: isActive || hasResp ? `drop-shadow(0 0 3px ${cmd.color}50)` : "none",
            animation: isActive
              ? cmd.anim === "spin"  ? "icSpin 1.2s linear infinite"
              : cmd.anim === "float" ? "icFloat 1.5s ease-in-out infinite"
              : cmd.anim === "shake" ? "icShake 0.4s ease-in-out infinite"
              : "icPulse 1s ease-in-out infinite" : "none",
          }}>
          <path d={ICONS[cmd.key]} />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: isActive || hasResp ? cmd.color : hov ? "#1a1a2e" : "#374151",
            transition: "color 0.2s",
          }}>{cmd.label}</div>
          {!hasResp && (
            <div style={{ fontSize: 9, color: "#d1d5db", fontFamily: "monospace" }}>{cmd.sub}</div>
          )}
        </div>
        {hasResp && (
          <span style={{ fontSize: 14, flexShrink: 0 }}>{response!.icon}</span>
        )}
      </div>

      {/* Respuesta expandida */}
      {hasResp && response && (
        <div style={{
          borderTop: `1px solid ${cmd.color}20`,
          paddingTop: 8, marginTop: 2,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: cmd.color, marginBottom: 4 }}>
            {response.label}
          </div>
          <div style={{
            fontSize: 9, color: "#6b7280", fontFamily: "monospace",
            wordBreak: "break-all", lineHeight: 1.5,
            background: "rgba(0,0,0,0.02)", padding: "4px 6px", borderRadius: 4,
            maxHeight: 48, overflow: "hidden",
          }}>
            {response.body}
          </div>
          {response.lat && response.lng && (
            <a href={`https://maps.google.com/maps?q=${response.lat},${response.lng}`}
              target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: "inline-flex", gap: 4, marginTop: 5, padding: "2px 7px",
                borderRadius: 4, background: `${cmd.color}10`,
                border: `1px solid ${cmd.color}25`,
                color: cmd.color, fontSize: 9, fontWeight: 700, textDecoration: "none",
              }}>
              📍 {response.lat.toFixed(4)}, {response.lng.toFixed(4)}
            </a>
          )}
          <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 4, textAlign: "right" }}>
            {response.time}
          </div>
        </div>
      )}

      {/* Estado waiting */}
      {state === "waiting" && (
        <div style={{ marginTop: 6, fontSize: 9, color: cmd.color, fontWeight: 600 }}>
          Esperando respuesta...
        </div>
      )}
      {state === "sending" && (
        <div style={{ marginTop: 6, fontSize: 9, color: cmd.color, fontWeight: 600 }}>
          Enviando...
        </div>
      )}
    </button>
  );
}

export default function ComandosPage() {
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sending, setSending]   = useState<string | null>(null);
  const [position, setPosition] = useState<Pos | null>(null);

  // Estado individual por comando
  const [cmdStates, setCmdStates]     = useState<Record<string, CmdState>>({});
  const [cmdResponses, setCmdResponses] = useState<Record<string, CmdResponse>>({});

  const prevMsgIds  = useRef<Set<number>>(new Set());
  const waitingCmd  = useRef<string | null>(null);
  const pollRef     = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef  = useRef<NodeJS.Timeout | null>(null);

  const withGps  = useMemo(() => clients.filter(c => c.sim_number), [clients]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? withGps : withGps.filter(c =>
      c.client_name.toLowerCase().includes(q) ||
      (c.vehicle_name || "").toLowerCase().includes(q) ||
      (c.sim_number || "").includes(q)
    );
  }, [withGps, search]);

  const sel = withGps.find(c => c.id === selected) ?? withGps[0];

  useEffect(() => { adminApi.getClients().then(c => { setClients(c); setLoading(false); }); }, []);

  const loadData = useCallback(async () => {
    if (!sel) return;
    try {
      const [msgs, pos] = await Promise.all([
        fetch(`${BASE}/admin/gps-messages?limit=20`, { headers: H() }).then(r => r.ok ? r.json() : []),
        fetch(`${BASE}/admin/live/${sel.id}`, { headers: H() }).then(r => r.ok ? r.json() : null),
      ]);

      if (pos?.ok) setPosition(pos);

      // Buscar mensajes nuevos para el comando en espera
      const newMsgs: Msg[] = (msgs || []).filter((m: Msg) => !prevMsgIds.current.has(m.id));
      newMsgs.forEach((m: Msg) => prevMsgIds.current.add(m.id));

      if (waitingCmd.current && newMsgs.length > 0) {
        const expects = CMD_EXPECTS[waitingCmd.current] || [];
        const match = newMsgs.find(m => expects.includes(m.parsed_type || "") || expects.includes("unknown"));
        if (match) {
          const key = waitingCmd.current;
          setCmdStates(prev => ({ ...prev, [key]: "answered" }));
          setCmdResponses(prev => ({
            ...prev,
            [key]: {
              label: match.label,
              icon: match.icon,
              body: match.body,
              lat: match.lat,
              lng: match.lng,
              time: new Date(match.received_at).toLocaleTimeString(),
            }
          }));
          waitingCmd.current = null;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      }
    } catch (_) { }
  }, [sel?.id]);

  useEffect(() => {
    if (!sel) return;
    loadData();
    pollRef.current = setInterval(loadData, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sel?.id, loadData]);

  async function handleCmd(key: string) {
    if (!sel || sending) return;
    setSending(key);
    setCmdStates(prev => ({ ...prev, [key]: "sending" }));
    setCmdResponses(prev => { const n = { ...prev }; delete n[key]; return n; });

    try {
      await sendCommand(sel.id, key);
      setCmdStates(prev => ({ ...prev, [key]: "waiting" }));
      waitingCmd.current = key;

      // Timeout 90s sin respuesta
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (waitingCmd.current === key) {
          setCmdStates(prev => ({ ...prev, [key]: "idle" }));
          waitingCmd.current = null;
        }
      }, 90000);
    } catch (_) {
      setCmdStates(prev => ({ ...prev, [key]: "idle" }));
    } finally {
      setSending(null);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f2f5", color: "#1a1a2e", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 240, borderRight: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", height: "100vh", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "#e8232a", textTransform: "uppercase", margin: "0 0 3px" }}>GPS Control EC</p>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e", letterSpacing: "-0.5px", margin: 0 }}>Panel GPS</h2>
        </div>
        <div style={{ padding: "10px 10px 4px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, SIM..."
            style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, color: "#374151", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
          <p style={{ fontSize: 9, color: "#9ca3af", margin: "4px 2px 0", fontWeight: 600 }}>
            {withGps.length} dispositivos GPS{search ? ` · ${filtered.length} resultados` : ""}
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 12px" }}>
          {loading ? [1, 2, 3].map(i => (
            <div key={i} style={{ height: 48, borderRadius: 8, background: "rgba(0,0,0,0.04)", marginBottom: 3, animation: "shimmer 1.5s infinite" }} />
          )) : filtered.map(c => {
            const active = c.id === (selected ?? withGps[0]?.id);
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} style={{ width: "100%", padding: "9px 10px", marginBottom: 2, background: active ? "rgba(232,35,42,0.06)" : "transparent", border: `1px solid ${active ? "rgba(232,35,42,0.2)" : "transparent"}`, borderLeft: `3px solid ${active ? "#e8232a" : "transparent"}`, borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: active ? "rgba(232,35,42,0.08)" : "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={active ? "#e8232a" : "#9ca3af"}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? "#1a1a2e" : "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.client_name}</div>
                    <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.vehicle_name || "—"}</div>
                  </div>
                  {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#e8232a", animation: "liveDot 2s infinite", flexShrink: 0 }} />}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN */}
      {sel ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

          {/* Top bar */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{sel.client_name}</h3>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "#9ca3af" }}>
                {sel.vehicle_name} · @{sel.username} · <span style={{ fontFamily: "monospace" }}>{sel.sim_number}</span>
              </p>
            </div>
            {position && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "liveDot 2s infinite" }} />
                <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>
                  {position.speed !== null ? `${Math.round(position.speed!)} km/h` : "En vivo"}
                  {position.battery !== null ? ` · 🔋${position.battery}%` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Contenido: mapa pequeño + grid comandos */}
          <div style={{ flex: 1, overflow: "auto", padding: "14px 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Mapa compacto */}
            <div style={{ height: 200, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", flexShrink: 0 }}>
              {position ? (
                <iframe key={`${position.lat}-${position.lng}`}
                  src={`https://maps.google.com/maps?q=${position.lat},${position.lng}&z=15&output=embed`}
                  width="100%" height="100%" style={{ border: "none", display: "block" }} title="GPS" />
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(255,255,255,0.7)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#d1d5db" style={{ animation: "icFloat 3s ease-in-out infinite" }}>
                    <path d={ICONS.locate} />
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>Sin posición</div>
                    <div style={{ fontSize: 10, color: "#d1d5db" }}>Envía "Localizar" para obtener coordenadas</div>
                  </div>
                </div>
              )}
            </div>

            {/* Grid de comandos — todos juntos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {ALL_COMMANDS.map(cmd => (
                <CommandCard
                  key={cmd.key}
                  cmd={cmd}
                  state={cmdStates[cmd.key] || "idle"}
                  response={cmdResponses[cmd.key] || null}
                  disabled={!!sending && sending !== cmd.key}
                  onSend={() => handleCmd(cmd.key)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" style={{ animation: "icFloat 3s ease-in-out infinite" }}>
            <path d={ICONS.locate} />
          </svg>
          <div style={{ fontSize: 14, color: "#9ca3af", fontWeight: 600 }}>Selecciona un cliente</div>
        </div>
      )}

      <style>{`
        @keyframes icSpin  { to{transform:rotate(360deg)} }
        @keyframes icFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes icShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
        @keyframes icPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:2px}
      `}</style>
    </div>
  );
}