"use client";
import { useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
const H = () => ({ "Content-Type": "application/json", "x-admin-token": getToken() || "" });

type Plan = { id:string; name:string; price:string; sub:string; desc:string; features:string[]; featured:boolean; waMsg:string; cta:string; active:boolean; sort_order:number; };

async function fetchPlans(): Promise<Plan[]> { const res = await fetch(`${BASE}/admin/plans`, { headers:H(), cache:"no-store" }); if (!res.ok) throw new Error("Error"); return res.json(); }
async function savePlan(plan: Plan): Promise<Plan> { const res = await fetch(`${BASE}/admin/plans/${plan.id}`, { method:"PATCH", headers:H(), body:JSON.stringify(plan) }); if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||"Error"); } return res.json(); }
async function resetPlans(): Promise<Plan[]> { const res = await fetch(`${BASE}/admin/plans/reset`, { method:"POST", headers:H() }); if (!res.ok) throw new Error("Error"); return res.json(); }

const S = {
  page:     { padding: "28px 32px", color: "#f0f6ff", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: "#0a0a0a", minHeight: "100vh" } as React.CSSProperties,
  label:    { display: "block", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6 } as React.CSSProperties,
  input:    { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, boxSizing: "border-box" as const, outline: "none" },
  btnRed:   { padding: "11px 22px", background: "#e8232a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnGhost: { padding: "8px 16px", background: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as React.CSSProperties,
  field:    { marginBottom: 16 } as React.CSSProperties,
};

export default function PlanesPage() {
  const [plans, setPlans]     = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan|null>(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{text:string;ok:boolean}|null>(null);

  const showMsg = (text: string, ok=true) => { setMsg({text,ok}); setTimeout(()=>setMsg(null),3000); };
  useEffect(() => { fetchPlans().then(setPlans).finally(()=>setLoading(false)); }, []);

  async function handleSave() {
    if (!editing) return; setSaving(true);
    try { const u = await savePlan(editing); setPlans(p=>p.map(x=>x.id===u.id?u:x)); setEditing(null); showMsg("Plan guardado"); }
    catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error", false); }
    finally { setSaving(false); }
  }
  async function handleReset() {
    if (!confirm("¿Restaurar planes por defecto?")) return;
    try { setPlans(await resetPlans()); showMsg("Planes restaurados"); }
    catch (e: unknown) { showMsg(e instanceof Error ? e.message : "Error", false); }
  }
  const sf = (k: keyof Plan, v: unknown) => setEditing(f => f ? {...f,[k]:v} : f);

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:32 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", color:"#e8232a", textTransform:"uppercase", margin:"0 0 6px" }}>GPS Control EC</p>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.8px", margin:"0 0 6px", color:"#fff" }}>Planes y precios</h1>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, margin:0 }}>Los cambios se publican automáticamente en gpscontrolec.com</p>
        </div>
        <button style={S.btnGhost} onClick={handleReset}>Restaurar defaults</button>
      </div>

      {msg && <div style={{ marginBottom:20, padding:"10px 16px", background:msg.ok?"rgba(34,197,94,0.08)":"rgba(232,35,42,0.08)", border:`1px solid ${msg.ok?"rgba(34,197,94,0.2)":"rgba(232,35,42,0.2)"}`, borderRadius:10, color:msg.ok?"#4ade80":"#ff6b6b", fontSize:13 }}>{msg.text}</div>}

      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:320, borderRadius:16, background:"rgba(255,255,255,0.03)", animation:"shimmer 1.5s infinite" }}/>)}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ background:"rgba(255,255,255,0.03)", border:plan.featured?"1px solid rgba(232,35,42,0.35)":"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding:28, position:"relative", opacity:plan.active?1:0.5, transition:"transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=plan.featured?"0 12px 40px rgba(232,35,42,0.15)":"0 12px 40px rgba(0,0,0,0.4)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
              {plan.featured && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:"#e8232a", color:"#fff", fontSize:9, fontWeight:800, padding:"3px 14px", borderRadius:999, letterSpacing:"0.1em", whiteSpace:"nowrap", textTransform:"uppercase" }}>Más popular</div>}
              {!plan.active && <div style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.3)", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:999, textTransform:"uppercase" as const }}>Inactivo</div>}

              <div style={{ fontSize:17, fontWeight:800, color:"#fff", marginBottom:4, letterSpacing:"-0.4px" }}>{plan.name}</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom:20 }}>{plan.desc}</div>

              <div style={{ marginBottom:22, paddingBottom:22, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:32, fontWeight:800, color:"#e8232a", letterSpacing:"-1px" }}>{plan.price}</span>
                <span style={{ color:"rgba(255,255,255,0.35)", fontSize:13, marginLeft:6 }}>{plan.sub}</span>
              </div>

              <ul style={{ listStyle:"none", padding:0, margin:"0 0 22px", display:"flex", flexDirection:"column", gap:10 }}>
                {plan.features.map((f,i) => (
                  <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.4 }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:"rgba(232,35,42,0.12)", border:"1px solid rgba(232,35,42,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#e8232a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <button style={{ ...S.btnGhost, width:"100%", fontSize:13, textAlign:"center" as const, justifyContent:"center" }} onClick={()=>setEditing({...plan,features:[...plan.features]})}>
                Editar plan
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={()=>setEditing(null)}>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:32, width:540, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ color:"#fff", fontSize:18, fontWeight:800, marginBottom:6, letterSpacing:"-0.5px" }}>Editar — {editing.name}</h2>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, marginBottom:24 }}>Los cambios se publican automáticamente en la web pública.</p>

            <div style={S.field}><label style={S.label}>Nombre</label><input style={S.input} value={editing.name} onChange={e=>sf("name",e.target.value)}/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={S.label}>Precio</label><input style={S.input} value={editing.price} onChange={e=>sf("price",e.target.value)} placeholder="$9.99"/></div>
              <div><label style={S.label}>Subtítulo</label><input style={S.input} value={editing.sub} onChange={e=>sf("sub",e.target.value)} placeholder="/mes por vehículo"/></div>
            </div>
            <div style={S.field}><label style={S.label}>Descripción corta</label><input style={S.input} value={editing.desc} onChange={e=>sf("desc",e.target.value)}/></div>
            <div style={{ display:"flex", gap:24, marginBottom:20 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"rgba(255,255,255,0.6)" }}><input type="checkbox" checked={editing.featured} onChange={e=>sf("featured",e.target.checked)}/> Más popular</label>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"rgba(255,255,255,0.6)" }}><input type="checkbox" checked={editing.active} onChange={e=>sf("active",e.target.checked)}/> Activo en web</label>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <label style={S.label}>Características</label>
                <button style={{ ...S.btnGhost, fontSize:11, padding:"4px 10px" }} onClick={()=>sf("features",[...editing.features,"Nueva característica"])}>+ Añadir</button>
              </div>
              {editing.features.map((f,i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input style={{ ...S.input, flex:1 }} value={f} onChange={e=>{ const a=[...editing.features]; a[i]=e.target.value; sf("features",a); }}/>
                  <button onClick={()=>sf("features",editing.features.filter((_,j)=>j!==i))} style={{ padding:"10px 12px", background:"rgba(232,35,42,0.08)", border:"1px solid rgba(232,35,42,0.2)", borderRadius:8, color:"#e8232a", cursor:"pointer", fontSize:16 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={S.field}><label style={S.label}>Mensaje WhatsApp</label><textarea value={editing.waMsg} onChange={e=>sf("waMsg",e.target.value)} rows={2} style={{ ...S.input, resize:"vertical" as const }}/></div>
            <div style={S.field}><label style={S.label}>Texto del botón CTA</label><input style={S.input} value={editing.cta} onChange={e=>sf("cta",e.target.value)}/></div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button style={S.btnGhost} onClick={()=>setEditing(null)}>Cancelar</button>
              <button style={{ ...S.btnRed, opacity:saving?0.6:1 }} onClick={handleSave} disabled={saving}>{saving?"Guardando...":"Guardar"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}