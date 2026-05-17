"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/admin/clientes",    label: "Clientes",    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href: "/admin/vehiculos",   label: "Vehículos",   icon: "M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-1 11a2 2 0 100-4 2 2 0 000 4zm-9 0a2 2 0 100-4 2 2 0 000 4zm10-7H9m4-4H9" },
  { href: "/admin/dispositivos",label: "Dispositivos",icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
  { href: "/admin/asignaciones",label: "Asignar",     icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Si está en /admin (login), no validar token
    if (pathname === "/admin") { setReady(true); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) { router.replace("/admin"); return; }
    setReady(true);
  }, [pathname, router]);

  function logout() {
    localStorage.removeItem("admin_token");
    router.replace("/admin");
  }

  // En la página de login, sólo renderizar children sin sidebar
  if (pathname === "/admin") return <>{children}</>;
  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a1628", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "#0f1f36",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        padding: "24px 0",
      }}>
        {/* Brand */}
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="7" stroke="#e8232a" strokeWidth="2"/>
              <circle cx="12" cy="10" r="3" fill="#e8232a"/>
              <path d="M12 17v5" stroke="#e8232a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ color: "#f0f6ff", fontWeight: 800, fontSize: 14, letterSpacing: -0.4 }}>GPS Control EC</span>
          </div>
          <div style={{ color: "rgba(200,218,238,0.35)", fontSize: 10, marginTop: 4, letterSpacing: 0.8 }}>PANEL ADMIN</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map(n => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                background: active ? "rgba(232,35,42,0.1)" : "transparent",
                border: `1px solid ${active ? "rgba(232,35,42,0.2)" : "transparent"}`,
                color: active ? "#f0f6ff" : "rgba(200,218,238,0.5)",
                fontSize: 13, fontWeight: active ? 600 : 400,
                textDecoration: "none", transition: "all 0.15s",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.icon}/>
                </svg>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 8,
            color: "rgba(200,218,238,0.4)", fontSize: 12,
            textDecoration: "none",
          }}>
            ← Ver web pública
          </Link>
          <button onClick={logout} style={{
            width: "100%", padding: "9px 12px", marginTop: 4,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(200,218,238,0.4)", fontSize: 12,
            textAlign: "left", borderRadius: 8,
          }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}