"use client";
import { useState, useEffect } from "react";

const PHONE = "593987654321";
const WA_BASE = `https://wa.me/${PHONE}`;

export default function WaFloat() {
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse]     = useState(false);

  // Aparece después de 2s, pulsa cada 8s para llamar atención
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 2000);
    const t2 = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 8000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        .wa-float {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .wa-bubble {
          background: #fff;
          color: #111;
          font-size: .82rem;
          font-weight: 500;
          padding: 9px 14px;
          border-radius: 14px 14px 4px 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,.15);
          white-space: nowrap;
          animation: waBubble .3s ease;
          line-height: 1.4;
        }
        .wa-btn {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25d366;
          border: none;
          cursor: pointer;
          display: grid;
          place-items: center;
          box-shadow: 0 4px 20px rgba(37,211,102,.45);
          transition: transform .15s, box-shadow .15s;
          text-decoration: none;
        }
        .wa-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 28px rgba(37,211,102,.55);
        }
        .wa-btn.pulse {
          animation: waPulse .6s ease;
        }
        .wa-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 14px;
          height: 14px;
          background: #e8232a;
          border-radius: 50%;
          border: 2px solid #fff;
        }
        @keyframes waBubble {
          from { opacity: 0; transform: translateY(6px) scale(.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes waPulse {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
        @media (max-width: 600px) {
          .wa-float { bottom: 18px; right: 16px; }
          .wa-bubble { display: none; }
        }
      `}</style>

      <div className="wa-float">
        {/* Burbuja de texto */}
        <div className="wa-bubble">
          Adquiere el servicio<br />
          <strong>por WhatsApp ahora</strong> 👋
        </div>

        {/* Botón principal */}
        <div style={{ position: "relative" }}>
          <a
            href={`${WA_BASE}?text=${encodeURIComponent("Hola, quiero adquirir el servicio de GPS Control EC.")}`}
            target="_blank"
            rel="noreferrer"
            className={`wa-btn${pulse ? " pulse" : ""}`}
            aria-label="Contactar por WhatsApp"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.847L.057 23.882l6.196-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.36-.214-3.727.977.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/>
            </svg>
          </a>
          <span className="wa-badge" />
        </div>
      </div>
    </>
  );
}
