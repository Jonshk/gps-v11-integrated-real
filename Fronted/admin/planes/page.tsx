"use client";
import { useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
}

type Plan = {
  id: string;
  name: string;
  price: string;
  sub: string;
  desc: string;
  features: string[];
  featured: boolean;
  waMsg: string;
  cta: string;
  active: boolean;
  sort_order: number;
};

async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch(`${BASE}/admin/plans`, {
    headers: { "x-admin-token": getToken() || "" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar planes");
  return res.json();
}

async function savePlan(plan: Plan): Promise<Plan> {
  const res = await fetch(`${BASE}/admin/plans/${plan.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getToken() || "",
    },
    body: JSON.stringify(plan),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al guardar");
  }
  return res.json();
}

async function resetPlans(): Promise<Plan[]> {
  const res = await fetch(`${BASE}/admin/plans/reset`, {
    method: "POST",
    headers: { "x-admin-token": getToken() || "" },
  });
  if (!res.ok) throw new Error("Error al restaurar");
  return res.json();
}

const S = {
  page: { padding: "32px 36px", color: "#f0f6ff", fontFamily: "Inter, system-ui, sans-serif" } as React.CSSProperties,
  label: { display: "block", color: "rgba(200,218,238,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 0.8, marginBottom: 6 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0f6ff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  btnPrimary: { padding: "10px 20px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnGhost: { padding: "8px 14px", background: "transparent", color: "rgba(200,218,238,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as React.CSSProperties,
};

export default function PlanesPage() {
  const [plans, setPlans]     = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);

  function showMsg(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }

  useEffect(() => {
    fetchPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  function openEdit(plan: Plan) {
    setEditing({ ...plan, features: [...plan.features] });
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await savePlan(editing);
      setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditing(null);
      showMsg("✓ Plan guardado correctamente en el servidor.");
    } catch (e: unknown) {
      showMsg(e instanceof Error ? e.message : "Error al guardar", false);
    } finally { setSaving(false); }
  }

  async function handleReset() {
    if (!confirm("¿Restaurar todos los planes por defecto? Se perderán los cambios.")) return;
    try {
      const plans = await resetPlans();
      setPlans(plans);
      showMsg("✓ Planes restaurados por defecto.");
    } catch (e: unknown) {
      showMsg(e instanceof Error ? e.message : "Error", false);
    }
  }

  function setField(k: keyof Plan, v: unknown) {
    setEditing(f => f ? { ...f, [k]: v } : f);
  }

  function addFeature() {
    setEditing(f => f ? { ...f, features: [...f.features, "Nueva característica"] } : f);
  }

  function updateFeature(i: number, v: string) {
    setEditing(f => {
      if (!f) return f;
      const features = [...f.features];
      features[i] = v;
      return { ...f, features };
    });
  }

  function removeFeature(i: number) {
    setEditing(f => f ? { ...f, features: f.features.filter((_, idx) => idx !== i) } : f);
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8 }}>Planes y precios</h1>
          <p style={{ color: "rgba(200,218,238,0.45)", fontSize: 13, marginTop: 4 }}>
            Los cambios se guardan en el servidor y se muestran en la web automáticamente.
          </p>
        </div>
        <button style={S.btnGhost} onClick={handleReset}>Restaurar defaults</button>
      </div>

      {/* Mensaje */}
      {msg && (
        <div style={{
          marginBottom: 20, padding: "12px 16px",
          background: msg.ok ? "rgba(0,212,160,0.08)" : "rgba(232,35,42,0.08)",
          border: `1px solid ${msg.ok ? "rgba(0,212,160,0.2)" : "rgba(232,35,42,0.2)"}`,
          borderRadius: 10, color: msg.ok ? "#00d4a0" : "#e8232a", fontSize: 13,
        }}>
          {msg.text}
        </div>
      )}

      {/* Info */}
      <div style={{ marginBottom: 24, padding: "14px 18px", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, fontSize: 13, color: "rgba(200,218,238,0.6)", lineHeight: 1.6 }}>
        ✅ Los cambios se publican <strong>automáticamente</strong> en <strong>gpscontrolec.com</strong> al guardar — sin tocar código ni hacer deploy.
      </div>

      {loading ? (
        <p style={{ color: "rgba(200,218,238,0.4)" }}>Cargando planes...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{
              background: "#0f1f36",
              border: plan.featured ? "1px solid rgba(232,35,42,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: 24, position: "relative",
              opacity: plan.active ? 1 : 0.5,
            }}>
              {plan.featured && (
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  background: "#e8232a", color: "#fff", fontSize: 10, fontWeight: 700,
                  padding: "3px 12px", borderRadius: 999, letterSpacing: 0.8, whiteSpace: "nowrap",
                }}>MÁS POPULAR</div>
              )}
              {!plan.active && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
                  color: "#f87171", fontSize: 10, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 999,
                }}>INACTIVO</div>
              )}

              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ color: "rgba(200,218,238,0.4)", fontSize: 12, marginBottom: 12 }}>{plan.desc}</div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#e8232a" }}>{plan.price}</span>
                <span style={{ color: "rgba(200,218,238,0.4)", fontSize: 12, marginLeft: 6 }}>{plan.sub}</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(200,218,238,0.7)" }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="#00d4a0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button style={{ ...S.btnPrimary, width: "100%", fontSize: 12 }} onClick={() => openEdit(plan)}>
                ✏️ Editar plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal edición */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={() => setEditing(null)}>
          <div style={{
            background: "#0f1f36", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: 32, width: 540,
            maxHeight: "90vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>

            <h2 style={{ color: "#f0f6ff", fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
              Editar — {editing.name}
            </h2>

            {/* Nombre */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>NOMBRE DEL PLAN</label>
              <input style={S.input} value={editing.name} onChange={e => setField("name", e.target.value)}/>
            </div>

            {/* Precio y sub */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={S.label}>PRECIO</label>
                <input style={S.input} value={editing.price} onChange={e => setField("price", e.target.value)} placeholder="$9,99"/>
              </div>
              <div>
                <label style={S.label}>SUBTÍTULO</label>
                <input style={S.input} value={editing.sub} onChange={e => setField("sub", e.target.value)} placeholder="/mes por vehículo"/>
              </div>
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>DESCRIPCIÓN CORTA</label>
              <input style={S.input} value={editing.desc} onChange={e => setField("desc", e.target.value)}/>
            </div>

            {/* Switches */}
            <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "rgba(200,218,238,0.7)" }}>
                <input type="checkbox" checked={editing.featured} onChange={e => setField("featured", e.target.checked)} style={{ width: 16, height: 16 }}/>
                Más popular
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "rgba(200,218,238,0.7)" }}>
                <input type="checkbox" checked={editing.active} onChange={e => setField("active", e.target.checked)} style={{ width: 16, height: 16 }}/>
                Activo (visible en web)
              </label>
            </div>

            {/* Características */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ ...S.label, margin: 0 }}>CARACTERÍSTICAS</label>
                <button style={{ ...S.btnGhost, fontSize: 11, padding: "5px 10px" }} onClick={addFeature}>+ Añadir</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {editing.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...S.input, flex: 1 }} value={f} onChange={e => updateFeature(i, e.target.value)}/>
                    <button onClick={() => removeFeature(i)} style={{
                      padding: "10px 12px", background: "rgba(232,35,42,0.08)",
                      border: "1px solid rgba(232,35,42,0.2)", borderRadius: 8,
                      color: "#e8232a", cursor: "pointer", fontSize: 14,
                    }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensaje WA */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>MENSAJE WHATSAPP</label>
              <textarea value={editing.waMsg} onChange={e => setField("waMsg", e.target.value)}
                rows={2} style={{ ...S.input, resize: "vertical" as const }}/>
            </div>

            {/* CTA */}
            <div style={{ marginBottom: 24 }}>
              <label style={S.label}>TEXTO DEL BOTÓN</label>
              <input style={S.input} value={editing.cta} onChange={e => setField("cta", e.target.value)}/>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={S.btnGhost} onClick={() => setEditing(null)}>Cancelar</button>
              <button
                style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}
                onClick={handleSave} disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar en servidor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
