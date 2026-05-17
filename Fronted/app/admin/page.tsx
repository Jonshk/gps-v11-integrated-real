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
      minHeight: "100vh", background: "#0a1628",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{
        width: 380, padding: "40px 36px",
        background: "#0f1f36",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(232,35,42,0.12)",
            display: "grid", placeItems: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="7" stroke="#e8232a" strokeWidth="2"/>
              <circle cx="12" cy="10" r="3" fill="#e8232a"/>
              <path d="M12 17v5" stroke="#e8232a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "#f0f6ff", fontWeight: 800, fontSize: 15, letterSpacing: -0.4 }}>
              GPS Control EC
            </div>
            <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 11, marginTop: 1 }}>
              Panel de administración
            </div>
          </div>
        </div>

        <h1 style={{ color: "#f0f6ff", fontSize: 24, fontWeight: 800, letterSpacing: -0.8, marginBottom: 24 }}>
          Acceso admin
        </h1>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", color: "rgba(200,218,238,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, marginBottom: 6 }}>
            CONTRASEÑA
          </label>

          {/* Input con ojito */}
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="Contraseña de administrador"
              required
              style={{
                width: "100%", padding: "13px 48px 13px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, color: "#f0f6ff",
                fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{
                position: "absolute", right: 14, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: "pointer", padding: 0,
                color: "rgba(200,218,238,0.4)",
                display: "flex", alignItems: "center",
              }}
            >
              {showPass ? (
                // Ojo cerrado
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                // Ojo abierto
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "rgba(232,35,42,0.08)",
              border: "1px solid rgba(232,35,42,0.2)",
              borderRadius: 8, color: "#e8232a", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", marginTop: 20, padding: "14px",
              background: loading ? "rgba(232,35,42,0.5)" : "#e8232a",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}