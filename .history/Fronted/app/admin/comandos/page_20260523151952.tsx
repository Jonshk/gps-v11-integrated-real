"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { adminApi, AppClient } from "@/lib/adminApi";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
}

const headers = () => ({
  "Content-Type": "application/json",
  "x-admin-token": getToken() || "",
});

async function sendCommand(clientId: string, command: string) {
  const res = await fetch(`${BASE}/admin/gateway/send`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ client_id: clientId, command }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Error al enviar");
  return data;
}

async function fetchMessages() {
  const res = await fetch(`${BASE}/admin/gps-messages?limit=30`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

async function fetchLivePosition(clientId: string) {
  const res = await fetch(`${BASE}/admin/live/${clientId}`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

async function fetchPositionHistory(clientId: string) {
  const res = await fetch(`${BASE}/admin/live/${clientId}/history?limit=50`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

// Comandos organizados por categoría
const COMMAND_GROUPS = [
  {
    label: "📍 Localización",
    commands: [
      { key: "locate",      label: "Localizar",         icon: "📍", color: "#00d4a0", desc: "tracker + check" },
      { key: "live_track",  label: "Tracking en vivo",  icon: "🗺️", color: "#60a5fa", desc: "fix030s999n" },
      { key: "stop_track",  label: "Parar tracking",    icon: "⏹️", color: "#6b7280", desc: "nofix" },
    ]
  },
  {
    label: "🚗 Motor",
    commands: [
      { key: "stop_engine",  label: "Apagar motor",    icon: "🔴", color: "#e8232a", desc: "stopelec" },
      { key: "start_engine", label: "Encender motor",  icon: "🟢", color: "#00d4a0", desc: "supplyelec" },
    ]
  },
  {
    label: "🚨 Alertas",
    commands: [
      { key: "move_alert",  label: "Alerta movimiento",  icon: "🚨", color: "#fbbf24", desc: "move" },
      { key: "speed_alert", label: "Alerta velocidad",   icon: "⚡", color: "#fb923c", desc: "speed 080" },
      { key: "no_speed",    label: "Desactivar vel.",    icon: "✋", color: "#6b7280", desc: "nospeed" },
    ]
  },
  {
    label: "🎤 Audio / Info",
    commands: [
      { key: "monitor",  label: "Micrófono",      icon: "🎤", color: "#a78bfa", desc: "monitor + llamada", callAfter: true },
      { key: "status",   label: "Estado GPS",     icon: "ℹ️", color: "#60a5fa", desc: "status" },
      { key: "battery",  label: "Batería",        icon: "🔋", color: "#34d399", desc: "battery" },
      { key: "reset",    label: "Reiniciar GPS",  icon: "🔄", color: "#fb923c", desc: "reset" },
    ]
  },
];

type GpsMessage = {
  id: number;
  from_number: string;
  body: string;
  received_at: string;
  parsed_type: string;
  label: string;
  icon: string;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  battery: number | null;
};

type Position = {
  lat: number;
  lng: number;
  speed: number | null;
  battery: number | null;
  recorded_at: string;
};

export default function ComandosPage() {
  const [clients, setClients]     = useState<AppClient[]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState<string | null>(null);
  const [messages, setMessages]   = useState<GpsMessage[]>([]);
  const [position, setPosition]   = useState<Position | null>(null);
  const [history, setHistory]     = useState<Position[]>([]);
  const [callAlert, setCallAlert] = useState<string | null>(null);
  const [log, setLog]             = useState<{text: string; ok: boolean; time: string}[]>([]);
  const mapRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const clientsWithGps = clients.filter(c => c.sim_number);
  const selectedClient = clientsWithGps.find(c => c.id === selected) ?? clientsWithGps[0];

  useEffect(() => {
    adminApi.getClients().then(c => {
      setClients(c.filter(cl => cl.sim_number));
      setLoading(false);
    });
  }, []);

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    if (typeof window !== "undefined" && !mapLoaded) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      setMapLoaded(true);
    }
  }, []);

  // Polling de mensajes y posición cada 5s
  useEffect(() => {
    if (!selectedClient) return;
    loadData();
    pollRef.current = setInterval(loadData, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedClient?.id]);

  async function loadData() {
    if (!selectedClient) return;
    try {
      const [msgs, pos, hist] = await Promise.all([
        fetchMessages(),
        fetchLivePosition(selectedClient.id),
        fetchPositionHistory(selectedClient.id),
      ]);
      setMessages(msgs);
      if (pos?.ok) setPosition(pos);
      setHistory(hist);
    } catch (_) {}
  }

  async function handleSend(command: string, callAfter = false) {
    if (!selectedClient) return;
    setSending(command);
    try {
      const res = await sendCommand(selectedClient.id, command);
      const time = new Date().toLocaleTimeString();
      setLog(prev => [{ text: `✓ ${res.label || command} encolado`, ok: true, time }, ...prev.slice(0, 19)]);
      if (callAfter || res.call_after) {
        setCallAlert(selectedClient.sim_number || "");
      }
    } catch (e: unknown) {
      const time = new Date().toLocaleTimeString();
      setLog(prev => [{ text: `✗ ${e instanceof Error ? e.message : "Error"}`, ok: false, time }, ...prev.slice(0, 19)]);
    } finally {
      setSending(null);
    }
  }

  const S = {
    page: { padding: "24px 28px", color: "#f0f6ff", fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#0a1628" } as React.CSSProperties,
    card: { background: "#0f1f36", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 } as React.CSSProperties,
    th: { padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "rgba(200,218,238,0.35)", letterSpacing: 1, textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.06)" },
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.8 }}>Panel GPS</h1>
        <p style={{ color: "rgba(200,218,238,0.4)", fontSize: 12, marginTop: 3 }}>
          Comandos SMS + Mapa en tiempo real
        </p>
      </div>

      {/* Alerta llamada para micrófono */}
      {callAlert && (
        <div style={{
          marginBottom: 16, padding: "14px 18px",
          background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: "1.4rem" }}>🎤</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#a78bfa", fontSize: 14 }}>Micrófono activado</div>
            <div style={{ color: "rgba(200,218,238,0.6)", fontSize: 12, marginTop: 2 }}>
              Llama ahora al número SIM del GPS: <strong style={{ color: "#a78bfa" }}>{callAlert}</strong>
            </div>
          </div>
          <a href={`tel:${callAlert}`} style={{
            padding: "8px 16px", background: "#a78bfa", color: "#fff",
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none",
          }}>📞 Llamar</a>
          <button onClick={() => setCallAlert(null)} style={{
            background: "none", border: "none", color: "rgba(200,218,238,0.4)",
            cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 14 }}>

        {/* Lista clientes */}
        <div style={{ ...S.card, overflow: "hidden" }}>
          <div style={S.th}>Clientes ({clientsWithGps.length})</div>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "rgba(200,218,238,0.3)", fontSize: 13 }}>Cargando...</div>
          ) : clientsWithGps.map(c => {
            const isActive = c.id === (selected ?? clientsWithGps[0]?.id);
            return (
              <div key={c.id} onClick={() => setSelected(c.id)} style={{
                padding: "12px 14px", cursor: "pointer",
                background: isActive ? "rgba(232,35,42,0.08)" : "transparent",
                borderLeft: `3px solid ${isActive ? "#e8232a" : "transparent"}`,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.client_name}</div>
                <div style={{ color: "rgba(200,218,238,0.35)", fontSize: 11, marginTop: 2 }}>
                  {c.vehicle_name || "Sin vehículo"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel derecho */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {selectedClient ? (
            <>
              {/* Header cliente */}
              <div style={{ ...S.card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedClient.client_name}</div>
                  <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 11 }}>
                    {selectedClient.vehicle_name} · @{selectedClient.username}
                  </div>
                </div>
                <div style={{ padding: "5px 10px", background: "rgba(0,212,160,0.08)", border: "1px solid rgba(0,212,160,0.2)", borderRadius: 7, fontSize: 11, fontFamily: "monospace", color: "#00d4a0" }}>
                  📡 {selectedClient.sim_number}
                </div>
                {position && (
                  <div style={{ padding: "5px 10px", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 7, fontSize: 11, color: "#60a5fa" }}>
                    🟢 En vivo · {position.speed ? `${Math.round(position.speed)} km/h` : "0 km/h"}
                    {position.battery ? ` · 🔋${position.battery}%` : ""}
                  </div>
                )}
              </div>

              {/* Mapa */}
              <div style={{ ...S.card, overflow: "hidden", height: 280 }}>
                {position ? (
                  <iframe
                    key={`${position.lat}-${position.lng}`}
                    src={`https://maps.google.com/maps?q=${position.lat},${position.lng}&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: "none", display: "block" }}
                    title="GPS Location"
                  />
                ) : (
                  <div style={{
                    height: "100%", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    color: "rgba(200,218,238,0.25)", gap: 8,
                  }}>
                    <span style={{ fontSize: 32 }}>🗺️</span>
                    <div style={{ fontSize: 13 }}>Sin posición registrada</div>
                    <div style={{ fontSize: 11, color: "rgba(200,218,238,0.15)" }}>
                      Envía "Localizar" para obtener la ubicación
                    </div>
                  </div>
                )}
              </div>

              {/* Botones comandos */}
              {COMMAND_GROUPS.map(group => (
                <div key={group.label} style={S.card}>
                  <div style={S.th}>{group.label}</div>
                  <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                    {group.commands.map(cmd => {
                      const isSending = sending === cmd.key;
                      return (
                        <button
                          key={cmd.key}
                          disabled={!!sending}
                          onClick={() => handleSend(cmd.key, cmd.callAfter)}
                          style={{
                            padding: "10px 14px",
                            background: `${cmd.color}12`,
                            border: `1px solid ${cmd.color}30`,
                            borderRadius: 10, cursor: isSending ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: 7,
                            opacity: sending && !isSending ? 0.4 : 1,
                            transition: "all 0.15s",
                          }}
                        >
                          {isSending ? (
                            <div style={{
                              width: 14, height: 14,
                              border: `2px solid ${cmd.color}`,
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite",
                            }}/>
                          ) : (
                            <span style={{ fontSize: 14 }}>{cmd.icon}</span>
                          )}
                          <div>
                            <div style={{ color: cmd.color, fontSize: 12, fontWeight: 600 }}>{cmd.label}</div>
                            <div style={{ color: "rgba(200,218,238,0.3)", fontSize: 9, fontFamily: "monospace" }}>{cmd.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Log de envíos */}
              {log.length > 0 && (
                <div style={S.card}>
                  <div style={{ ...S.th, display: "flex", justifyContent: "space-between" }}>
                    <span>Comandos enviados</span>
                    <button onClick={() => setLog([])} style={{ background: "none", border: "none", color: "rgba(200,218,238,0.3)", cursor: "pointer", fontSize: 11 }}>Limpiar</button>
                  </div>
                  {log.map((l, i) => (
                    <div key={i} style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 10, fontSize: 12 }}>
                      <span style={{ flex: 1, color: l.ok ? "#00d4a0" : "#e8232a" }}>{l.text}</span>
                      <span style={{ color: "rgba(200,218,238,0.25)" }}>{l.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Respuestas del GPS */}
              <div style={S.card}>
                <div style={{ ...S.th, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Respuestas del GPS <span style={{ color: "rgba(200,218,238,0.2)", fontSize: 9 }}>↻ cada 5s</span></span>
                  <button
                    onClick={async () => {
                      await fetch(`${BASE}/admin/gps-messages`, { method: "DELETE", headers: headers() });
                      setMessages([]);
                    }}
                    style={{ background: "none", border: "none", color: "rgba(200,218,238,0.3)", cursor: "pointer", fontSize: 11 }}
                  >Limpiar</button>
                </div>
                {messages.length === 0 ? (
                  <div style={{ padding: "20px 14px", textAlign: "center", color: "rgba(200,218,238,0.2)", fontSize: 12 }}>
                    Esperando respuestas del GPS...
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: msg.parsed_type === "sos_alert" ? "rgba(232,35,42,0.05)" : "transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 16, lineHeight: 1.3 }}>{msg.icon || "💬"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f6ff" }}>{msg.label || msg.parsed_type}</span>
                          <span style={{ fontSize: 10, color: "rgba(200,218,238,0.25)" }}>
                            {new Date(msg.received_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ color: "rgba(200,218,238,0.45)", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" as const, marginBottom: msg.lat ? 8 : 0 }}>
                          {msg.body}
                        </div>
                        {msg.battery !== null && msg.battery !== undefined && (
                          <span style={{ fontSize: 11, color: "#34d399", marginRight: 10 }}>🔋 {msg.battery}%</span>
                        )}
                        {msg.speed !== null && msg.speed !== undefined && (
                          <span style={{ fontSize: 11, color: "#60a5fa" }}>⚡ {Math.round(msg.speed)} km/h</span>
                        )}
                        {msg.lat && msg.lng && (
                          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                            <a
                              href={`https://maps.google.com/maps?q=${msg.lat},${msg.lng}`}
                              target="_blank" rel="noreferrer"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "4px 10px", borderRadius: 6,
                                background: "rgba(0,212,160,0.1)", border: "1px solid rgba(0,212,160,0.25)",
                                color: "#00d4a0", fontSize: 11, fontWeight: 600, textDecoration: "none",
                              }}
                            >
                              📍 Ver en mapa · {msg.lat.toFixed(5)}, {msg.lng.toFixed(5)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ ...S.card, padding: 48, textAlign: "center", color: "rgba(200,218,238,0.25)", fontSize: 14 }}>
              Selecciona un cliente para ver el panel
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
