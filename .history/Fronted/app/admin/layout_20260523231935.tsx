"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href:"/admin/clientes",    label:"Clientes",     icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href:"/admin/vehiculos",   label:"Vehículos",    icon:"M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-1 11a2 2 0 100-4 2 2 0 000 4zm-9 0a2 2 0 100-4 2 2 0 000 4zm10-7H9m4-4H9" },
  { href:"/admin/dispositivos",label:"Dispositivos", icon:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
  { href:"/admin/asignaciones",label:"Asignar",      icon:"M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href:"/admin/comandos",    label:"Comandos SMS", icon:"M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", badge: true },
  { href:"/admin/planes",      label:"Planes",       icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

function NavItem({ n, active }: { n: typeof NAV[0]; active: boolean }) {
  const [hov, setHov] = useState(false);
  const isCmd = n.href === "/admin/comandos";

  return (
    <Link href={n.href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10, marginBottom: 3,
        background: active ? "rgba(232,35,42,0.1)" : hov ? "rgba(255,255,255,0.04)" : "transparent",
        border: `1px solid ${active ? "rgba(232,35,42,0.25)" : "transparent"}`,
        borderLeft: active ? "3px solid #e8232a" : "3px solid transparent",
        color: active ? "#fff" : hov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
        fontSize: 13, fontWeight: active ? 700 : 400,
        textDecoration: "none",
        transition: "all 0.15s cubic-bezier(0.32,0.72,0,1)",
      }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={n.icon}/>
      </svg>
      <span style={{ flex: 1 }}>{n.label}</span>
      {n.badge && (
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e8232a", boxShadow: "0 0 8px #e8232a", animation: "liveDot 2s infinite" }}/>
      )}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin") { setReady(true); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) { router.replace("/admin"); return; }
    setReady(true);
  }, [pathname, router]);

  function logout() { localStorage.removeItem("admin_token"); router.replace("/admin"); }

  if (pathname === "/admin") return <>{children}</>;
  if (!ready) return null;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0a0a0a", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:220, flexShrink:0, background:"#0d0d0d", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0 }}>

        {/* Logo */}
        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:4 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"rgba(232,35,42,0.12)", border:"1px solid rgba(232,35,42,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="10" r="6" stroke="#e8232a" strokeWidth="2"/>
                <circle cx="12" cy="10" r="2.5" fill="#e8232a"/>
                <path d="M12 16v5" stroke="#e8232a" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:13, letterSpacing:"-0.3px" }}>GPS Control EC</div>
              <div style={{ color:"rgba(255,255,255,0.25)", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Panel Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto" }}>
          {NAV.map(n => (
            <NavItem key={n.href} n={n} active={pathname.startsWith(n.href)}/>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, color:"rgba(255,255,255,0.25)", fontSize:12, textDecoration:"none", transition:"color 0.15s" }}
            onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,255,255,0.5)")}
            onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.25)")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Ver web pública
          </Link>
          <button onClick={logout} style={{ width:"100%", padding:"8px 12px", marginTop:2, background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.25)", fontSize:12, textAlign:"left", borderRadius:8, transition:"color 0.15s" }}
            onMouseEnter={e=>(e.currentTarget.style.color="rgba(248,113,113,0.7)")}
            onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.25)")}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <main style={{ flex:1, overflow:"auto", background:"#0a0a0a" }}>
        {children}
      </main>

      <style>{`@keyframes liveDot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}