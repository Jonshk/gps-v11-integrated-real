"use client";
import { useEffect, useState } from "react";
import { adminApi, AppClient } from "@/lib/adminApi";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
}

async function sendCommand(clientId: string, command: string) {
  const res = await fetch(`${BASE}/admin/sms/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getToken() || "",
    },
    body: JSON.stringify({ client_id: clientId, command }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Error al enviar comando");
  return data;
}

const COMMANDS = [
  { id: "locate",       label: "Localizar",         icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", color: "#00d4a0" },
  { id: "stop_engine",  label: "Apagar motor",       icon: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z", color: "#e8232a" },
  { id: "start_engine", label: "Encender motor",     icon: "M8 5v14l11-7z", color: "#00d4a0" },
  { id: "move_alert",   label: "Alerta movimiento",  icon: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z", color: "#fbbf24" },
  { id: "speed_alert",  label: "Alerta velocidad",   icon: "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z", color: "#fb923c" },
  { id: "online",       label: "Modo activo",        icon: "M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z", color: "#60a5fa" },
  { id: "monitor",      label: "Micrófono espía",    icon: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z", color: "#a78bfa" },
];

type CmdResult = { clientId: string; command: string; ok: boolean; message: string; };

export default function ComandosPage() {
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState<string | null>(null); // "clientId:command"
  const [results, setResults]   = useState<CmdResult[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getClients().then(c => {
      setClients(c.filter(cl => cl.sim_number));
      setLoading(false);
    });
  }, []);

  async function handleSend(clientId: string, command: string) {
    const key = `${clientId}:${command}`;
    setSending(key);
    try {
      const res = await sendCommand(clientId, command);
      setResults(prev => [{
        clientId, command, ok: true,
        message: res.message || "Comando enviado",
      }, ...prev.slice(0, 19)]);
    } catch (e: unknown) {
      setResults(prev => [{
        clientId, command, ok: false,
        message: e instanceof Error ? e.message : "Error",
      }, ...prev.slice(0, 19)]);
    } finally {
      setSending(null);
    }
  }

  const clientsWithGps = clients.filter(c => c.sim_number);
  const selectedClient = clientsWithGps.find(c => c.id === selected) || clientsWithGps[0];

  return (
    <div style={{ padding: "32px 36px", color: "#f0f6ff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8 }}>Comandos SMS</h1>
        <p style={{ color: "rgba(200,218,238,0.45)", fontSize: 13, marginTop: 4 }}>
          Envía comandos directamente al GPS del cliente via Twilio — sin depender del teléfono del cliente.
        </p>
      </div>

      {/* Alerta emergencia */}
      <div style={{
        marginBottom: 24, padding: "14px 18px",
        background: "rgba(232,35,42,0.06)",
        border: "1px solid rgba(232,35,42,0.2)",
        borderRadius: 12, fontSize: 13,
        color: "rgba(200,218,238,0.7)", lineHeight: 1.6,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: "1.3rem" }}>🚨</span>
        <div>
          <strong style={{ color: "#e8232a" }}>Emergencia:</strong> Si un cliente reporta robo del vehículo
          y no tiene acceso a su app, selecciona el cliente aquí y envía el comando
          <strong> "Apagar motor"</strong> para inmovilizar el vehículo remotamente.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>

        {/* Lista de clientes */}
        <div style={{
          background: "#0f1f36",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11, fontWeight: 700,
            color: "rgba(200,218,238,0.35)", letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Clientes con GPS ({clientsWithGps.length})
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: "center",
                color: "rgba(200,218,238,0.3)", fontSize: 13 }}>
              Cargando...
            </div>
          ) : clientsWithGps.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center",
                color: "rgba(200,218,238,0.3)", fontSize: 13 }}>
              Sin clientes con GPS asignado
            </div>
          ) : clientsWithGps.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                padding: "14px 16px", cursor: "pointer",
                background: (selected === c.id || (!selected && c.id === clientsWithGps[0]?.id))
                  ? "rgba(232,35,42,0.08)" : "transparent",
                borderLeft: `3px solid ${(selected === c.id || (!selected && c.id === clientsWithGps[0]?.id))
                  ? "#e8232a" : "transparent"}`,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.client_name}</div>
              <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 11, marginTop: 3 }}>
                {c.vehicle_name || "Sin vehículo"}
              </div>
            </div>
          ))}
        </div>

        {/* Panel de comandos */}
        <div>
          {selectedClient ? (
            <>
              {/* Header del cliente seleccionado */}
              <div style={{
                background: "#0f1f36",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "16px 20px",
                marginBottom: 16,
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(0,212,160,0.1)",
                  display: "grid", placeItems: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#00d4a0" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedClient.client_name}</div>
                  <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 12, marginTop: 2 }}>
                    {selectedClient.vehicle_name} · @{selectedClient.username}
                  </div>
                </div>
                {/* SIM visible solo para admin */}
                <div style={{
                  padding: "6px 12px",
                  background: "rgba(0,212,160,0.08)",
                  border: "1px solid rgba(0,212,160,0.2)",
                  borderRadius: 8, fontSize: 12,
                  fontFamily: "monospace", color: "#00d4a0",
                }}>
                  📡 SIM: {selectedClient.sim_number}
                </div>
              </div>

              {/* Grid de comandos */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10, marginBottom: 20,
              }}>
                {COMMANDS.map(cmd => {
                  const key = `${selectedClient.id}:${cmd.id}`;
                  const isSending = sending === key;
                  return (
                    <button
                      key={cmd.id}
                      disabled={isSending || sending !== null}
                      onClick={() => handleSend(selectedClient.id, cmd.id)}
                      style={{
                        padding: "18px 14px",
                        background: `${cmd.color}10`,
                        border: `1px solid ${cmd.color}25`,
                        borderRadius: 14, cursor: isSending ? "not-allowed" : "pointer",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 10,
                        transition: "all 0.15s",
                        opacity: sending && !isSending ? 0.5 : 1,
                      }}
                    >
                      {isSending ? (
                        <div style={{
                          width: 24, height: 24, border: `2px solid ${cmd.color}`,
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}/>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24"
                          fill={cmd.color}>
                          <path d={cmd.icon}/>
                        </svg>
                      )}
                      <span style={{
                        color: cmd.color, fontSize: 12,
                        fontWeight: 600, textAlign: "center",
                      }}>
                        {cmd.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Log de comandos enviados */}
              {results.length > 0 && (
                <div style={{
                  background: "#0f1f36",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 11, fontWeight: 700,
                    color: "rgba(200,218,238,0.35)", letterSpacing: 1,
                    textTransform: "uppercase",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span>Historial de comandos</span>
                    <button
                      onClick={() => setResults([])}
                      style={{ background: "none", border: "none",
                        color: "rgba(200,218,238,0.3)", cursor: "pointer",
                        fontSize: 11 }}
                    >
                      Limpiar
                    </button>
                  </div>
                  {results.map((r, i) => {
                    const cmd = COMMANDS.find(c => c.id === r.command);
                    const cli = clientsWithGps.find(c => c.id === r.clientId);
                    return (
                      <div key={i} style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: r.ok ? "#00d4a0" : "#e8232a",
                          flexShrink: 0,
                        }}/>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {cmd?.label || r.command}
                          </span>
                          <span style={{ color: "rgba(200,218,238,0.4)",
                              fontSize: 12, marginLeft: 8 }}>
                            → {cli?.client_name || r.clientId}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 12,
                          color: r.ok ? "#00d4a0" : "#e8232a",
                        }}>
                          {r.ok ? "✓ Enviado" : "✗ Error"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{
              background: "#0f1f36",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: 48,
              textAlign: "center",
              color: "rgba(200,218,238,0.3)", fontSize: 14,
            }}>
              Selecciona un cliente para enviar comandos
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
