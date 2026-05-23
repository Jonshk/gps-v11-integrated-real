"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { adminApi, AppClient } from "@/lib/adminApi";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
const H = () => ({ "Content-Type": "application/json", "x-admin-token": getToken() || "" });

async function sendCommand(clientId: string, command: string) {
  const res = await fetch(`${BASE}/admin/gateway/send`, { method: "POST", headers: H(), body: JSON.stringify({ client_id: clientId, command }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Error");
  return data;
}

// SVG path data for animated icons
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

const COMMANDS = [
  { key:"locate",       label:"Localizar",       sub:"tracker + check",   accent:"#00ffb3", glow:"#00e5a0", group:"loc", anim:"float"  },
  { key:"live_track",   label:"Live Tracking",   sub:"fix030s999n",       accent:"#38d9f5", glow:"#0ea5e9", group:"loc", anim:"spin"   },
  { key:"stop_track",   label:"Parar tracking",  sub:"nofix",             accent:"#64748b", glow:"#475569", group:"loc", anim:"pulse"  },
  { key:"stop_engine",  label:"Apagar motor",    sub:"stopelec",          accent:"#ff4d6d", glow:"#e11d48", group:"eng", anim:"shake"  },
  { key:"start_engine", label:"Encender motor",  sub:"supplyelec",        accent:"#00ffb3", glow:"#00e5a0", group:"eng", anim:"pulse"  },
  { key:"move_alert",   label:"Alerta mov.",     sub:"move",              accent:"#ffd60a", glow:"#f59e0b", group:"alr", anim:"shake"  },
  { key:"speed_alert",  label:"Speed alarm",     sub:"speed 080",         accent:"#ff7c2a", glow:"#ea580c", group:"alr", anim:"float"  },
  { key:"no_speed",     label:"Sin alerta vel.", sub:"nospeed",           accent:"#64748b", glow:"#475569", group:"alr", anim:"pulse"  },
  { key:"monitor",      label:"Micrófono",       sub:"monitor + llamada", accent:"#c084fc", glow:"#9333ea", group:"inf", anim:"pulse", callAfter:true },
  { key:"status",       label:"Estado GPS",      sub:"status",            accent:"#38d9f5", glow:"#0ea5e9", group:"inf", anim:"float"  },
  { key:"battery",      label:"Batería",         sub:"battery",           accent:"#4ade80", glow:"#16a34a", group:"inf", anim:"pulse"  },
  { key:"reset",        label:"Reiniciar",       sub:"reset",             accent:"#fb923c", glow:"#ea580c", group:"inf", anim:"spin"   },
];

const GROUPS = [
  { id:"loc", label:"Localización",  color:"#00ffb3" },
  { id:"eng", label:"Motor",         color:"#ff4d6d" },
  { id:"alr", label:"Alertas",       color:"#ffd60a" },
  { id:"inf", label:"Audio / Info",  color:"#c084fc" },
];

type Msg = { id:number; body:string; received_at:string; label:string; icon:string; lat:number|null; lng:number|null; speed:number|null; battery:number|null; };
type Pos = { lat:number; lng:number; speed:number|null; battery:number|null; recorded_at:string; };

// Animated icon component
function CmdCard({ cmd, onSend, disabled }: { cmd: typeof COMMANDS[0]; onSend: () => void; disabled: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      disabled={disabled}
      onClick={onSend}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: "16px 14px 14px",
        background: hovered
          ? `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)`
          : `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
        border: `1px solid ${hovered ? cmd.accent + "40" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 18,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
        transform: hovered && !disabled ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 8px 32px ${cmd.glow}25, inset 0 1px 0 rgba(255,255,255,0.1)`
          : `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
        opacity: disabled && !hovered ? 0.4 : 1,
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        width: 32, height: 32, borderRadius: "50%",
        background: `radial-gradient(circle at center, ${cmd.accent}30, transparent 70%)`,
        transition: "all 0.3s",
        opacity: hovered ? 1 : 0.5,
      }}/>

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, marginBottom: 10,
        background: `linear-gradient(135deg, ${cmd.accent}20, ${cmd.glow}10)`,
        border: `1px solid ${cmd.accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: hovered ? `0 0 16px ${cmd.glow}40` : "none",
        transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
      }}>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill={cmd.accent}
          style={{
            animation: hovered
              ? cmd.anim === "spin"   ? "iconSpin 1s linear infinite"
              : cmd.anim === "float"  ? "iconFloat 1.2s ease-in-out infinite"
              : cmd.anim === "shake"  ? "iconShake 0.5s ease-in-out infinite"
              : "iconPulse 1s ease-in-out infinite"
              : "none",
            filter: hovered ? `drop-shadow(0 0 4px ${cmd.accent})` : "none",
            transition: "filter 0.3s",
          }}
        >
          <path d={ICONS[cmd.key] || ICONS.status}/>
        </svg>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: hovered ? "#f1f5f9" : "#94a3b8", letterSpacing: "-0.3px", marginBottom: 3, transition: "color 0.2s" }}>{cmd.label}</div>
      <div style={{ fontSize: 9, color: hovered ? cmd.accent + "99" : "#1e3a5f", fontFamily: "monospace", letterSpacing: "0.05em" }}>{cmd.sub}</div>
    </button>
  );
}

export default function ComandosPage() {
  const [clients, setClients]     = useState<AppClient[]>([]);
  const [selected, setSelected]   = useState<string|null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [sending, setSending]     = useState<string|null>(null);
  const [messages, setMessages]   = useState<Msg[]>([]);
  const [position, setPosition]   = useState<Pos|null>(null);
  const [log, setLog]             = useState<{text:string;ok:boolean;time:string}[]>([]);
  const [callAlert, setCallAlert] = useState<string|null>(null);
  const pollRef = useRef<NodeJS.Timeout|null>(null);

  const withGps = useMemo(() => clients.filter(c => c.sim_number), [clients]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? withGps : withGps.filter(c =>
      c.client_name.toLowerCase().includes(q) ||
      (c.vehicle_name||"").toLowerCase().includes(q) ||
      (c.username||"").toLowerCase().includes(q) ||
      (c.sim_number||"").includes(q)
    );
  }, [withGps, search]);

  const sel = withGps.find(c => c.id === selected) ?? withGps[0];

  useEffect(() => { adminApi.getClients().then(c => { setClients(c); setLoading(false); }); }, []);

  const loadData = useCallback(async () => {
    if (!sel) return;
    const [msgs, pos] = await Promise.all([
      fetch(`${BASE}/admin/gps-messages?limit=20`, { headers: H() }).then(r => r.ok ? r.json() : []),
      fetch(`${BASE}/admin/live/${sel.id}`, { headers: H() }).then(r => r.ok ? r.json() : null),
    ]).catch(() => [[], null]);
    setMessages(msgs || []);
    if (pos?.ok) setPosition(pos);
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
      const t = new Date().toLocaleTimeString("es", { hour:"2-digit", minute:"2-digit" });
      setLog(p => [{ text: res.label || key, ok: true, time: t }, ...p.slice(0, 9)]);
      if (callAfter || res.call_after) setCallAlert(sel.sim_number || "");
    } catch (e: unknown) {
      const t = new Date().toLocaleTimeString("es", { hour:"2-digit", minute:"2-digit" });
      setLog(p => [{ text: e instanceof Error ? e.message : "Error", ok: false, time: t }, ...p.slice(0, 9)]);
    } finally { setSending(null); }
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#040d18", color:"#cbd5e1", fontFamily:"'Plus Jakarta Sans','DM Sans',system-ui,sans-serif", position:"relative", overflow:"hidden" }}>

      {/* Background mesh */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 70%)" }}/>
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(56,217,245,0.04) 0%, transparent 70%)" }}/>
        <div style={{ position:"absolute", top:"40%", left:"40%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(192,132,252,0.03) 0%, transparent 70%)" }}/>
      </div>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:280, borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh", zIndex:10, background:"rgba(4,13,24,0.8)", backdropFilter:"blur(20px)" }}>
        <div style={{ padding:"24px 20px 16px" }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(0,229,160,0.4)", textTransform:"uppercase", margin:"0 0 4px" }}>GPS Control EC</p>
          <h2 style={{ fontSize:18, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.6px", margin:0 }}>Panel GPS</h2>
        </div>

        <div style={{ padding:"0 14px 8px" }}>
          <div style={{ position:"relative" }}>
            <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="12" height="12" viewBox="0 0 24 24" fill="rgba(100,116,139,0.5)">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, SIM..."
              style={{ width:"100%", padding:"9px 10px 9px 28px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, color:"#94a3b8", fontSize:12, outline:"none", boxSizing:"border-box", backdropFilter:"blur(10px)" }}/>
          </div>
          <p style={{ fontSize:10, color:"rgba(100,116,139,0.4)", margin:"6px 2px 0", fontWeight:600 }}>
            {search ? `${filtered.length} / ${withGps.length} clientes` : `${withGps.length} dispositivos GPS`}
          </p>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"4px 10px 16px" }}>
          {loading ? [1,2,3,4].map(i => (
            <div key={i} style={{ height:54, borderRadius:12, background:"rgba(255,255,255,0.03)", marginBottom:4, animation:"shimmer 1.5s infinite" }}/>
          )) : filtered.map(c => {
            const active = c.id === (selected ?? withGps[0]?.id);
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} style={{
                width:"100%", padding:"10px 12px", marginBottom:4,
                background: active ? "rgba(0,229,160,0.07)" : "transparent",
                border:`1px solid ${active ? "rgba(0,229,160,0.2)" : "transparent"}`,
                borderRadius:12, cursor:"pointer", textAlign:"left",
                backdropFilter: active ? "blur(10px)" : "none",
                boxShadow: active ? "inset 0 1px 0 rgba(0,229,160,0.1)" : "none",
                transition:"all 0.25s cubic-bezier(0.32,0.72,0,1)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background: active ? "rgba(0,229,160,0.12)" : "rgba(255,255,255,0.03)", border:`1px solid ${active ? "rgba(0,229,160,0.25)" : "rgba(255,255,255,0.06)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "#00e5a0" : "rgba(100,116,139,0.4)"}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: active ? "#e2eaf4" : "#475569", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:"-0.2px" }}>{c.client_name}</div>
                    <div style={{ fontSize:10, color: active ? "rgba(0,229,160,0.4)" : "rgba(100,116,139,0.3)", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.vehicle_name || "—"}</div>
                  </div>
                  {active && <div style={{ width:6, height:6, borderRadius:"50%", background:"#00e5a0", boxShadow:"0 0 8px #00e5a040", animation:"liveDot 2s ease-in-out infinite", flexShrink:0 }}/>}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN ── */}
      {sel ? (
        <main style={{ flex:1, padding:"24px 28px", overflowY:"auto", position:"relative", zIndex:1 }}>
          <div style={{ maxWidth:940 }}>

            {/* Call alert */}
            {callAlert && (
              <div style={{ marginBottom:20, padding:"14px 18px", background:"rgba(192,132,252,0.08)", border:"1px solid rgba(192,132,252,0.25)", borderRadius:14, display:"flex", alignItems:"center", gap:14, backdropFilter:"blur(20px)", boxShadow:"0 4px 24px rgba(147,51,234,0.15), inset 0 1px 0 rgba(255,255,255,0.08)", animation:"slideDown 0.4s cubic-bezier(0.32,0.72,0,1)" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#c084fc", boxShadow:"0 0 12px #c084fc", animation:"liveDot 1.5s infinite", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:"#e9d5ff", fontSize:13 }}>Micrófono activado — llama al GPS ahora</div>
                  <div style={{ color:"rgba(192,132,252,0.5)", fontSize:11, marginTop:2 }}>Número: <span style={{ fontFamily:"monospace", color:"#c084fc" }}>{callAlert}</span></div>
                </div>
                <a href={`tel:${callAlert}`} style={{ padding:"8px 18px", background:"linear-gradient(135deg,#9333ea,#7c3aed)", color:"#fff", borderRadius:8, fontWeight:700, fontSize:12, textDecoration:"none", boxShadow:"0 4px 12px rgba(147,51,234,0.4)" }}>📞 Llamar</a>
                <button onClick={() => setCallAlert(null)} style={{ background:"none", border:"none", color:"rgba(192,132,252,0.4)", cursor:"pointer", fontSize:22, lineHeight:1 }}>×</button>
              </div>
            )}

            {/* Client header — glass card */}
            <div style={{ marginBottom:20, padding:"18px 22px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, backdropFilter:"blur(30px)", boxShadow:"0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg, rgba(0,229,160,0.15), rgba(0,229,160,0.05))", border:"1px solid rgba(0,229,160,0.25)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(0,229,160,0.1)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#00e5a0">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div style={{ flex:1 }}>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.5px" }}>{sel.client_name}</h3>
                <p style={{ margin:"4px 0 0", fontSize:11, color:"rgba(100,116,139,0.6)" }}>{sel.vehicle_name} · @{sel.username}</p>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const, justifyContent:"flex-end" }}>
                {position && (
                  <div style={{ padding:"5px 12px", background:"rgba(0,229,160,0.07)", border:"1px solid rgba(0,229,160,0.2)", borderRadius:8, fontSize:11, color:"#00e5a0", display:"flex", alignItems:"center", gap:6, backdropFilter:"blur(10px)" }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#00e5a0", display:"inline-block", boxShadow:"0 0 8px #00e5a0", animation:"liveDot 2s infinite" }}/>
                    {position.speed !== null ? `${Math.round(position.speed!)} km/h` : "En vivo"}
                    {position.battery !== null ? ` · 🔋${position.battery}%` : ""}
                  </div>
                )}
                <div style={{ padding:"5px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, fontSize:10, color:"rgba(100,116,139,0.5)", fontFamily:"monospace" }}>{sel.sim_number}</div>
              </div>
            </div>

            {/* Map + Responses */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16, marginBottom:20 }}>

              {/* Map glass card */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, overflow:"hidden", height:300, backdropFilter:"blur(20px)", boxShadow:"0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                {position ? (
                  <iframe key={`${position.lat}-${position.lng}`}
                    src={`https://maps.google.com/maps?q=${position.lat},${position.lng}&z=15&output=embed`}
                    width="100%" height="100%" style={{ border:"none", display:"block" }} title="GPS"/>
                ) : (
                  <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
                    <div style={{ width:60, height:60, borderRadius:16, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", animation:"iconFloat 3s ease-in-out infinite" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(100,116,139,0.3)">
                        <path d={ICONS.locate}/>
                      </svg>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"rgba(100,116,139,0.4)" }}>Sin posición registrada</div>
                      <div style={{ fontSize:11, color:"rgba(100,116,139,0.2)", marginTop:4 }}>Envía "Localizar" para obtener coordenadas</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Responses glass card */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, display:"flex", flexDirection:"column", overflow:"hidden", backdropFilter:"blur(20px)", boxShadow:"0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                <div style={{ padding:"12px 16px 10px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#e2eaf4", letterSpacing:"-0.2px" }}>Respuestas GPS</div>
                    <div style={{ fontSize:9, color:"rgba(100,116,139,0.4)", marginTop:1 }}>↻ cada 5 segundos</div>
                  </div>
                  <button onClick={async () => { await fetch(`${BASE}/admin/gps-messages`, { method:"DELETE", headers:H() }); setMessages([]); }}
                    style={{ background:"none", border:"none", color:"rgba(100,116,139,0.3)", cursor:"pointer", fontSize:11 }}>Limpiar</button>
                </div>
                <div style={{ flex:1, overflowY:"auto" }}>
                  {messages.length === 0 ? (
                    <div style={{ padding:"28px 16px", textAlign:"center" }}>
                      <div style={{ fontSize:26, marginBottom:8, animation:"iconFloat 3s ease-in-out infinite" }}>📡</div>
                      <div style={{ fontSize:11, color:"rgba(100,116,139,0.3)" }}>Esperando respuestas...</div>
                    </div>
                  ) : messages.map(msg => (
                    <div key={msg.id} style={{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <span style={{ fontSize:14, lineHeight:1.3, flexShrink:0 }}>{msg.icon || "💬"}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", gap:4, marginBottom:2 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:"#cbd5e1" }}>{msg.label}</span>
                            <span style={{ fontSize:9, color:"rgba(100,116,139,0.3)", fontFamily:"monospace", flexShrink:0 }}>{new Date(msg.received_at).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ fontSize:9, color:"rgba(100,116,139,0.35)", fontFamily:"monospace", wordBreak:"break-all", lineHeight:1.5 }}>{msg.body}</div>
                          <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" as const }}>
                            {msg.battery !== null && msg.battery !== undefined && <span style={{ fontSize:10, color:"#4ade80" }}>🔋 {msg.battery}%</span>}
                            {msg.speed !== null && msg.speed !== undefined && <span style={{ fontSize:10, color:"#38d9f5" }}>⚡ {Math.round(msg.speed)} km/h</span>}
                          </div>
                          {msg.lat && msg.lng && (
                            <a href={`https://maps.google.com/maps?q=${msg.lat},${msg.lng}`} target="_blank" rel="noreferrer"
                              style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:5, padding:"3px 8px", borderRadius:5, background:"rgba(0,229,160,0.07)", border:"1px solid rgba(0,229,160,0.2)", color:"#00e5a0", fontSize:9, fontWeight:700, textDecoration:"none" }}>
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

            {/* Command groups — glass morphing cards with animated icons */}
            {GROUPS.map(g => {
              const cmds = COMMANDS.filter(c => c.group === g.id);
              return (
                <div key={g.id} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <div style={{ width:4, height:16, borderRadius:2, background:g.color, boxShadow:`0 0 8px ${g.color}60` }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:`${g.color}99`, letterSpacing:"0.12em", textTransform:"uppercase" }}>{g.label}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:10 }}>
                    {cmds.map(cmd => (
                      <CmdCard key={cmd.key} cmd={cmd} disabled={!!sending} onSend={() => handleCmd(cmd.key, (cmd as any).callAfter)} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Activity log */}
            {log.length > 0 && (
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden", backdropFilter:"blur(20px)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:"rgba(100,116,139,0.4)", textTransform:"uppercase" }}>Actividad reciente</span>
                  <button onClick={() => setLog([])} style={{ background:"none", border:"none", color:"rgba(100,116,139,0.25)", cursor:"pointer", fontSize:11 }}>Limpiar</button>
                </div>
                {log.map((l, i) => (
                  <div key={i} style={{ padding:"8px 16px", borderBottom:"1px solid rgba(255,255,255,0.03)", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background: l.ok ? "#00e5a0" : "#ff4d6d", boxShadow:`0 0 6px ${l.ok ? "#00e5a0" : "#ff4d6d"}60`, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:12, color: l.ok ? "#00e5a0" : "#ff4d6d" }}>{l.ok ? "✓ " : "✗ "}{l.text}</span>
                    <span style={{ fontSize:10, color:"rgba(100,116,139,0.2)", fontFamily:"monospace" }}>{l.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, zIndex:1 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", animation:"iconFloat 3s ease-in-out infinite" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(100,116,139,0.3)">
              <path d={ICONS.locate}/>
            </svg>
          </div>
          <div style={{ fontSize:14, color:"rgba(100,116,139,0.3)", fontWeight:600 }}>Selecciona un cliente</div>
        </div>
      )}

      <style>{`
        @keyframes iconSpin  { to { transform: rotate(360deg); } }
        @keyframes iconFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes iconShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
        @keyframes iconPulse { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.15); opacity:.8; } }
        @keyframes liveDot   { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        @keyframes shimmer   { 0%,100% { opacity:.4; } 50% { opacity:.8; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:2px; }
      `}</style>
    </div>
  );
}