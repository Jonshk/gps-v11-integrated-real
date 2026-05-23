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

async function pollCommandStatus(commandId: string, timeout = 90000): Promise<"sent"|"failed"|"timeout"> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(`${BASE}/admin/gateway/queue?limit=20`, { headers: H() });
      if (!res.ok) continue;
      const queue = await res.json();
      const cmd = queue.find((q: any) => q.id === commandId);
      if (!cmd) continue;
      if (cmd.status === "sent") return "sent";
      if (cmd.status === "failed") return "failed";
    } catch (_) {}
  }
  return "timeout";
}

// SVG paths
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

type CmdDef = { key: string; label: string; sub: string; color: string; anim: string; callAfter?: boolean };

const COMMAND_GRID: CmdDef[][] = [
  [
    { key:"locate",       label:"Localizar",       sub:"tracker + check",   color:"#e8232a", anim:"float"  },
    { key:"live_track",   label:"Live Tracking",   sub:"fix030s999n",       color:"#e8232a", anim:"spin"   },
    { key:"stop_track",   label:"Parar tracking",  sub:"nofix",             color:"#555",    anim:"pulse"  },
    { key:"stop_engine",  label:"Apagar motor",    sub:"stopelec",          color:"#e8232a", anim:"shake"  },
    { key:"start_engine", label:"Encender motor",  sub:"supplyelec",        color:"#22c55e", anim:"pulse"  },
    { key:"move_alert",   label:"Alerta mov.",     sub:"move",              color:"#f59e0b", anim:"shake"  },
  ],
  [
    { key:"speed_alert",  label:"Speed alarm",     sub:"speed 080",         color:"#f59e0b", anim:"float"  },
    { key:"no_speed",     label:"Sin vel.",        sub:"nospeed",           color:"#555",    anim:"pulse"  },
    { key:"monitor",      label:"Micrófono",       sub:"monitor + llamada", color:"#a855f7", anim:"pulse", callAfter:true },
    { key:"status",       label:"Estado GPS",      sub:"status",            color:"#3b82f6", anim:"float"  },
    { key:"battery",      label:"Batería",         sub:"battery",           color:"#22c55e", anim:"pulse"  },
    { key:"reset",        label:"Reiniciar",       sub:"reset",             color:"#f97316", anim:"spin"   },
  ],
];

type Msg = { id:number; body:string; received_at:string; label:string; icon:string; lat:number|null; lng:number|null; speed:number|null; battery:number|null; };
type Pos = { lat:number; lng:number; speed:number|null; battery:number|null; recorded_at:string; };
type StatusAlert = { type:"pending"|"sent"|"failed"|"timeout"|"no_response"; label:string; detail:string; };

function GlassCmd({ cmd, onSend, disabled }: { cmd: CmdDef; onSend: ()=>void; disabled: boolean }) {
  const [hov, setHov] = useState(false);
  const busy = disabled;

  return (
    <button
      disabled={disabled}
      onClick={onSend}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        padding: "22px 18px 18px",
        background: hov
          ? "rgba(255,255,255,0.07)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16,
        backdropFilter: "blur(20px)",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
        transform: hov && !disabled ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hov
          ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`
          : `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
        opacity: disabled ? 0.5 : 1,
        overflow: "hidden",
      }}
    >
      {/* Red accent line top */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background: hov ? `linear-gradient(90deg, ${cmd.color}, transparent)` : "transparent", transition:"all 0.3s", borderRadius:"16px 16px 0 0" }}/>

      {/* Icon */}
      <div style={{ marginBottom:14 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill={hov ? cmd.color : "rgba(255,255,255,0.3)"}
          style={{
            transition:"all 0.3s",
            filter: hov ? `drop-shadow(0 0 6px ${cmd.color}80)` : "none",
            animation: hov
              ? cmd.anim === "spin"   ? "icSpin 1.2s linear infinite"
              : cmd.anim === "float"  ? "icFloat 1.5s ease-in-out infinite"
              : cmd.anim === "shake"  ? "icShake 0.4s ease-in-out infinite"
              : "icPulse 1s ease-in-out infinite"
              : "none",
          }}
        ><path d={ICONS[cmd.key]}/></svg>
      </div>

      <div style={{ fontSize:14, fontWeight:700, color: hov ? "#fff" : "rgba(255,255,255,0.7)", letterSpacing:"-0.3px", marginBottom:4, transition:"color 0.2s" }}>{cmd.label}</div>
      <div style={{ fontSize:9, color: hov ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)", fontFamily:"monospace", letterSpacing:"0.06em" }}>{cmd.sub}</div>
    </button>
  );
}

export default function ComandosPage() {
  const [clients, setClients]   = useState<AppClient[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sending, setSending]   = useState<string|null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [position, setPosition] = useState<Pos|null>(null);
  const [callAlert, setCallAlert] = useState<string|null>(null);
  const [statusAlert, setStatusAlert] = useState<StatusAlert|null>(null);
  const pollRef = useRef<NodeJS.Timeout|null>(null);

  const withGps = useMemo(() => clients.filter(c => c.sim_number), [clients]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? withGps : withGps.filter(c =>
      c.client_name.toLowerCase().includes(q) ||
      (c.vehicle_name||"").toLowerCase().includes(q) ||
      (c.sim_number||"").includes(q)
    );
  }, [withGps, search]);

  const sel = withGps.find(c => c.id === selected) ?? withGps[0];

  useEffect(() => { adminApi.getClients().then(c => { setClients(c); setLoading(false); }); }, []);

  const loadData = useCallback(async () => {
    if (!sel) return;
    const [msgs, pos] = await Promise.all([
      fetch(`${BASE}/admin/gps-messages?limit=10`, { headers:H() }).then(r=>r.ok?r.json():[]),
      fetch(`${BASE}/admin/live/${sel.id}`, { headers:H() }).then(r=>r.ok?r.json():null),
    ]).catch(()=>[[], null]);
    setMessages(msgs||[]);
    if (pos?.ok) setPosition(pos);
  }, [sel?.id]);

  useEffect(() => {
    if (!sel) return;
    loadData();
    pollRef.current = setInterval(loadData, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sel?.id, loadData]);

  async function handleCmd(key: string, callAfter = false) {
    if (!sel || sending) return;
    setSending(key);
    setStatusAlert({ type:"pending", label:"Enviando comando...", detail:"Esperando que la APK Gateway recoja el SMS" });

    try {
      const res = await sendCommand(sel.id, key);
      const cmdId = res.command_id || (res.command_ids && res.command_ids[0]);

      // Diagnóstico en background
      if (cmdId) {
        setStatusAlert({ type:"pending", label:"Comando encolado", detail:"APK Gateway enviará el SMS en los próximos 10 segundos" });
        pollCommandStatus(cmdId).then(status => {
          if (status === "sent") {
            setStatusAlert({ type:"sent", label:"SMS enviado al GPS", detail:"Esperando respuesta del GPS (hasta 90s)..." });
            // Esperar respuesta
            setTimeout(() => {
              setStatusAlert(prev => prev?.type === "sent"
                ? { type:"no_response", label:"Sin respuesta del GPS", detail:"Posibles causas: sin señal GSM, GPS apagado, número SIM incorrecto o batería baja" }
                : prev
              );
            }, 90000);
          } else if (status === "failed") {
            setStatusAlert({ type:"failed", label:"Error al enviar SMS", detail:"El móvil no pudo enviar el SMS. Verifica permisos de la APK Gateway o saldo de la SIM" });
          } else {
            setStatusAlert({ type:"timeout", label:"APK Gateway no responde", detail:"La app Gateway no está activa en el móvil. Ábrela y activa el servicio" });
          }
        });
      }

      if (callAfter || res.call_after) setCallAlert(sel.sim_number || "");
    } catch (e: unknown) {
      setStatusAlert({ type:"failed", label:"Error de conexión", detail: e instanceof Error ? e.message : "Error desconocido" });
    } finally { setSending(null); }
  }

  const statusColors: Record<string, string> = {
    pending:     "#f59e0b",
    sent:        "#22c55e",
    failed:      "#e8232a",
    timeout:     "#e8232a",
    no_response: "#f97316",
  };

  const statusIcons: Record<string, string> = {
    pending:     "⏳",
    sent:        "✓",
    failed:      "✗",
    timeout:     "⚠",
    no_response: "⚠",
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#0a0a0a", color:"#fff", fontFamily:"'Plus Jakarta Sans','DM Sans',system-ui,sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:260, borderRight:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", height:"100vh", background:"#0d0d0d", flexShrink:0 }}>
        <div style={{ padding:"22px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
          <h2 style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.5px", margin:0 }}>Panel GPS</h2>
        </div>

        <div style={{ padding:"12px 12px 6px" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente, SIM..."
            style={{ width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"rgba(255,255,255,0.6)", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", margin:"6px 2px 0", fontWeight:600 }}>
            {withGps.length} dispositivos GPS{search ? ` · ${filtered.length} resultados` : ""}
          </p>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"4px 10px 16px" }}>
          {loading ? [1,2,3].map(i=>(
            <div key={i} style={{ height:52, borderRadius:10, background:"rgba(255,255,255,0.04)", marginBottom:4, animation:"shimmer 1.5s infinite" }}/>
          )) : filtered.map(c => {
            const active = c.id === (selected ?? withGps[0]?.id);
            return (
              <button key={c.id} onClick={()=>setSelected(c.id)} style={{
                width:"100%", padding:"10px 12px", marginBottom:3,
                background: active ? "rgba(232,35,42,0.08)" : "transparent",
                border:`1px solid ${active ? "rgba(232,35,42,0.3)" : "transparent"}`,
                borderLeft:`3px solid ${active ? "#e8232a" : "transparent"}`,
                borderRadius:10, cursor:"pointer", textAlign:"left",
                transition:"all 0.2s cubic-bezier(0.32,0.72,0,1)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background: active ? "rgba(232,35,42,0.15)" : "rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "#e8232a" : "rgba(255,255,255,0.25)"}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: active ? "#fff" : "rgba(255,255,255,0.4)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.client_name}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.vehicle_name||"—"}</div>
                  </div>
                  {active && <div style={{ width:6, height:6, borderRadius:"50%", background:"#e8232a", boxShadow:"0 0 8px #e8232a", animation:"liveDot 2s infinite", flexShrink:0 }}/>}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN ── */}
      {sel ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>

          {/* Top bar */}
          <div style={{ padding:"14px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:16, background:"#0d0d0d", flexShrink:0 }}>
            <div style={{ flex:1 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#fff", letterSpacing:"-0.4px" }}>{sel.client_name}</h3>
              <p style={{ margin:"2px 0 0", fontSize:11, color:"rgba(255,255,255,0.3)" }}>{sel.vehicle_name} · @{sel.username} · <span style={{ fontFamily:"monospace" }}>{sel.sim_number}</span></p>
            </div>
            {position && (
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e", animation:"liveDot 2s infinite" }}/>
                <span style={{ fontSize:11, color:"#22c55e", fontWeight:600 }}>
                  {position.speed !== null ? `${Math.round(position.speed!)} km/h` : "En vivo"}
                  {position.battery !== null ? ` · 🔋${position.battery}%` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Status alert */}
          {statusAlert && (
            <div style={{ margin:"10px 24px 0", padding:"10px 16px", background: `${statusColors[statusAlert.type]}10`, border:`1px solid ${statusColors[statusAlert.type]}30`, borderRadius:10, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <span style={{ fontSize:16, color:statusColors[statusAlert.type] }}>{statusIcons[statusAlert.type]}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:statusColors[statusAlert.type] }}>{statusAlert.label}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:1 }}>{statusAlert.detail}</div>
              </div>
              <button onClick={()=>setStatusAlert(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
            </div>
          )}

          {/* Call alert */}
          {callAlert && (
            <div style={{ margin:"10px 24px 0", padding:"10px 16px", background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.25)", borderRadius:10, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#a855f7", boxShadow:"0 0 8px #a855f7", animation:"liveDot 1.5s infinite" }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#c084fc" }}>Micrófono activado — llama al GPS</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>Número: <span style={{ fontFamily:"monospace", color:"#a855f7" }}>{callAlert}</span></div>
              </div>
              <a href={`tel:${callAlert}`} style={{ padding:"7px 16px", background:"#7c3aed", color:"#fff", borderRadius:8, fontWeight:700, fontSize:12, textDecoration:"none" }}>Llamar</a>
              <button onClick={()=>setCallAlert(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
            </div>
          )}

          {/* Content grid — todo en pantalla */}
          <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", gridTemplateRows:"1fr 1fr", overflow:"hidden", padding:"14px 24px 16px", gap:"12px" }}>

            {/* Mapa — row span 2 */}
            <div style={{ gridRow:"1 / 3", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
              {position ? (
                <iframe key={`${position.lat}-${position.lng}`}
                  src={`https://maps.google.com/maps?q=${position.lat},${position.lng}&z=15&output=embed`}
                  width="100%" height="100%" style={{ border:"none", display:"block" }} title="GPS"/>
              ) : (
                <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)" style={{ animation:"icFloat 3s ease-in-out infinite" }}>
                    <path d={ICONS.locate}/>
                  </svg>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.2)" }}>Sin posición</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.1)", marginTop:4 }}>Envía "Localizar" para obtener coordenadas</div>
                  </div>
                </div>
              )}
            </div>

            {/* Comandos — fila 1 */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"14px 14px 10px", overflow:"hidden" }}>
              <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 10px" }}>Comandos</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                {COMMAND_GRID[0].map(cmd => (
                  <GlassCmd key={cmd.key} cmd={cmd} disabled={!!sending} onSend={()=>handleCmd(cmd.key, cmd.callAfter)} />
                ))}
              </div>
            </div>

            {/* Respuestas GPS — fila 2 */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"12px 14px 8px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.18em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", margin:0 }}>Respuestas GPS · cada 5s</p>
                <button onClick={async()=>{ await fetch(`${BASE}/admin/gps-messages`,{method:"DELETE",headers:H()}); setMessages([]); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.2)", cursor:"pointer", fontSize:11 }}>Limpiar</button>
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {messages.length === 0 ? (
                  <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:16 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.08)" style={{ animation:"icFloat 3s ease-in-out infinite" }}>
                      <path d={ICONS.live_track}/>
                    </svg>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.15)", textAlign:"center" }}>Esperando respuestas del GPS...</div>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} style={{ padding:"9px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{msg.icon||"💬"}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{msg.label}</span>
                          <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"monospace" }}>{new Date(msg.received_at).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontFamily:"monospace", wordBreak:"break-all", lineHeight:1.5 }}>{msg.body}</div>
                        {msg.lat && msg.lng && (
                          <a href={`https://maps.google.com/maps?q=${msg.lat},${msg.lng}`} target="_blank" rel="noreferrer"
                            style={{ display:"inline-flex", gap:4, marginTop:4, padding:"3px 8px", borderRadius:5, background:"rgba(232,35,42,0.1)", border:"1px solid rgba(232,35,42,0.2)", color:"#e8232a", fontSize:9, fontWeight:700, textDecoration:"none" }}>
                            📍 {msg.lat.toFixed(4)}, {msg.lng.toFixed(4)}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom command row */}
          <div style={{ padding:"0 24px 16px", flexShrink:0 }}>
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"12px 14px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:7 }}>
                {COMMAND_GRID[1].map(cmd => (
                  <GlassCmd key={cmd.key} cmd={cmd} disabled={!!sending} onSend={()=>handleCmd(cmd.key, cmd.callAfter)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.08)" style={{ animation:"icFloat 3s ease-in-out infinite" }}>
            <path d={ICONS.locate}/>
          </svg>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.2)", fontWeight:600 }}>Selecciona un cliente</div>
        </div>
      )}

      <style>{`
        @keyframes icSpin  { to{transform:rotate(360deg)} }
        @keyframes icFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes icShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
        @keyframes icPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:.7} }
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
      `}</style>
    </div>
  );
}