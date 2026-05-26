"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pass, setPass]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await adminApi.login(pass);
      localStorage.setItem("admin_token", res.token);
      router.replace("/admin/clientes");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f2f5 0%, #e8edf5 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -120, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(232,35,42,0.06)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -60, width: 350, height: 350, borderRadius: "50%", background: "rgba(59,130,246,0.05)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{
        width: 400, padding: "40px 36px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.9)",
        borderRadius: 24,
        boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "rgba(232,35,42,0.08)",
            border: "1px solid rgba(232,35,42,0.15)",
            display: "grid", placeItems: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="7" stroke="#e8232a" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" fill="#e8232a" />
              <path d="M12 17v5" stroke="#e8232a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ color: "#1a1a2e", fontWeight: 800, fontSize: 15, letterSpacing: -0.4 }}>GPS Control EC</div>
            <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 1 }}>Panel de administración</div>
          </div>
        </div>

        <h1 style={{ color: "#1a1a2e", fontSize: 24, fontWeight: 800, letterSpacing: -0.8, marginBottom: 24 }}>
          Acceso admin
        </h1>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" }}>
            Contraseña
          </label>

          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="Contraseña de administrador"
              required
              style={{
                width: "100%", padding: "13px 48px 13px 16px",
                background: "rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 12, color: "#1a1a2e",
                fontSize: 14, outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(232,35,42,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(232,35,42,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{
              position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer", padding: 0,
              color: "#9ca3af", display: "flex", alignItems: "center",
            }}>
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "rgba(232,35,42,0.05)",
              border: "1px solid rgba(232,35,42,0.15)",
              borderRadius: 10, color: "#e8232a", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", marginTop: 20, padding: "14px",
            background: loading ? "rgba(232,35,42,0.5)" : "#e8232a",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 14, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 16px rgba(232,35,42,0.3)",
            transition: "all 0.2s",
          }}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
