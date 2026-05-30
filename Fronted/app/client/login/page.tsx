'use client'
// login_page.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/app/client/login/page.tsx  (CREAR)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API } from '@/lib/useClientSession'

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser]     = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/app/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Credenciales incorrectas'); return }
      sessionStorage.setItem('gps_session', JSON.stringify(data))
      router.push('/client/dashboard')
    } catch { setError('Error de conexión') }
    finally  { setLoading(false) }
  }

  return (
    <main style={{
      minHeight:'100dvh', background:'#050608',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Sans',system-ui,sans-serif", position:'relative', overflow:'hidden',
    }}>
      {/* Orbs de fondo */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:'600px',height:'600px',
          background:'radial-gradient(circle,rgba(0,180,216,0.12) 0%,transparent 70%)',borderRadius:'50%'}}/>
        <div style={{position:'absolute',bottom:'-10%',right:'-10%',width:'500px',height:'500px',
          background:'radial-gradient(circle,rgba(0,100,160,0.10) 0%,transparent 70%)',borderRadius:'50%'}}/>
      </div>

      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:'420px',margin:'0 24px'}}>
        {/* Double bezel */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'28px',padding:'6px'}}>
          <div style={{background:'#0d1117',borderRadius:'23px',padding:'40px 36px',
            boxShadow:'inset 0 1px 1px rgba(255,255,255,0.06)'}}>

            {/* Logo */}
            <div style={{textAlign:'center',marginBottom:'36px'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                <div style={{width:'36px',height:'36px',
                  background:'linear-gradient(135deg,#00b4d8,#0077b6)',
                  borderRadius:'10px',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:'18px'}}>📡</div>
                <span style={{fontSize:'22px',fontWeight:'700',color:'#fff',letterSpacing:'-0.5px'}}>
                  GPS Control</span>
              </div>
              <p style={{color:'rgba(255,255,255,0.35)',fontSize:'13px',margin:0}}>Portal de seguimiento</p>
            </div>

            <form onSubmit={login}>
              {[
                {label:'Usuario', val:user, set:setUser, type:'text',    ph:'tu_usuario'},
                {label:'Contraseña', val:pass, set:setPass, type:'password', ph:'••••••••'},
              ].map(f => (
                <div key={f.label} style={{marginBottom:'16px'}}>
                  <label style={{display:'block',fontSize:'11px',fontWeight:'600',
                    color:'rgba(255,255,255,0.4)',textTransform:'uppercase',
                    letterSpacing:'0.1em',marginBottom:'8px'}}>{f.label}</label>
                  <div style={{background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',overflow:'hidden'}}>
                    <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)}
                      placeholder={f.ph} required
                      style={{width:'100%',padding:'13px 16px',background:'transparent',
                        border:'none',outline:'none',color:'#fff',fontSize:'15px',boxSizing:'border-box'}}/>
                  </div>
                </div>
              ))}

              {error && (
                <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',
                  borderRadius:'10px',padding:'10px 14px',color:'#f87171',
                  fontSize:'13px',marginBottom:'20px'}}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{
                width:'100%',padding:'14px',
                background:loading?'rgba(0,180,216,0.4)':'linear-gradient(135deg,#00b4d8,#0077b6)',
                border:'none',borderRadius:'12px',color:'#fff',fontSize:'15px',
                fontWeight:'600',cursor:loading?'not-allowed':'pointer',
                transition:'all 0.3s cubic-bezier(0.32,0.72,0,1)',
              }}>{loading?'Iniciando sesión...':'Entrar →'}</button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        input::placeholder{color:rgba(255,255,255,0.2);}
        *{box-sizing:border-box;}
      `}</style>
    </main>
  )
}