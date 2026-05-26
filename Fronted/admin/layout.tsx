"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/admin/clientes",     label: "Clientes",     icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href: "/admin/vehiculos",    label: "Vehículos",    icon: "M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-1 11a2 2 0 100-4 2 2 0 000 4zm-9 0a2 2 0 100-4 2 2 0 000 4zm10-7H9m4-4H9" },
  { href: "/admin/dispositivos", label: "Dispositivos", icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
  { href: "/admin/asignaciones", label: "Asignar",      icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/comandos",     label: "Comandos SMS", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", badge: true },
  { href: "/admin/planes",       label: "Planes",       icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/admin/logs",         label: "Logs",         icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

function NavItem({ n, active }: { n: typeof NAV[0]; active: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={n.href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 10, marginBottom: 2,
        background: active ? "rgba(232,35,42,0.08)" : hov ? "rgba(0,0,0,0.04)" : "transparent",
        border: `1px solid ${active ? "rgba(232,35,42,0.2)" : "transparent"}`,
        borderLeft: `3px solid ${active ? "#e8232a" : "transparent"}`,
        color: active ? "#e8232a" : hov ? "#1a1a2e" : "#6b7280",
        fontSize: 13, fontWeight: active ? 700 : 500,
        textDecoration: "none",
        transition: "all 0.15s cubic-bezier(0.32,0.72,0,1)",
      }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={n.icon} />
      </svg>
      <span style={{ flex: 1 }}>{n.label}</span>
      {n.badge && (
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e8232a", boxShadow: "0 0 8px rgba(232,35,42,0.5)", animation: "liveDot 2s infinite" }} />
      )}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#f0f2f5",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 224, flexShrink: 0,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(0,0,0,0.06)",
        display: "flex", flexDirection: "column",
        height: "100vh", position: "sticky", top: 0,
        boxShadow: "2px 0 20px rgba(0,0,0,0.04)",
      }}>

        {/* Logo */}
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(232,35,42,0.08)",
              border: "1px solid rgba(232,35,42,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="10" r="6" stroke="#e8232a" strokeWidth="2" />
                <circle cx="12" cy="10" r="2.5" fill="#e8232a" />
                <path d="M12 16v5" stroke="#e8232a" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ color: "#1a1a2e", fontWeight: 800, fontSize: 13, letterSpacing: "-0.3px" }}>GPS Control EC</div>
              <div style={{ color: "#9ca3af", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Panel Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV.map(n => <NavItem key={n.href} n={n} active={pathname.startsWith(n.href)} />)}
        </nav>

        {/* Footer */}
        <div style={{ padding: "10px 10px 16px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 8,
            color: "#9ca3af", fontSize: 12, textDecoration: "none",
            transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#6b7280")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Ver web pública
          </Link>
          <button onClick={logout} style={{
            width: "100%", padding: "8px 12px", marginTop: 2,
            background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", fontSize: 12, textAlign: "left",
            borderRadius: 8, transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#e8232a")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, overflow: "auto", background: "#f0f2f5" }}>
        {children}
      </main>

      <style>{`
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
