"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "light" | "dim" | "dark";

export const THEMES: Record<Theme, {
  bg: string; sidebar: string; card: string; cardHov: string;
  border: string; text: string; textMuted: string; textFaint: string;
  topbar: string; input: string;
}> = {
  light: {
    bg: "#f0f2f5",
    sidebar: "rgba(255,255,255,0.92)",
    card: "rgba(255,255,255,0.85)",
    cardHov: "#ffffff",
    border: "rgba(0,0,0,0.07)",
    text: "#1a1a2e",
    textMuted: "#6b7280",
    textFaint: "#9ca3af",
    topbar: "rgba(255,255,255,0.92)",
    input: "rgba(0,0,0,0.03)",
  },
  dim: {
    bg: "#1a1d2e",
    sidebar: "rgba(22,25,40,0.97)",
    card: "rgba(28,32,50,0.95)",
    cardHov: "rgba(34,38,58,0.98)",
    border: "rgba(255,255,255,0.07)",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    textFaint: "#4a5568",
    topbar: "rgba(18,21,35,0.97)",
    input: "rgba(255,255,255,0.04)",
  },
  dark: {
    bg: "#0d0f1a",
    sidebar: "rgba(10,12,22,0.98)",
    card: "rgba(15,18,30,0.95)",
    cardHov: "rgba(20,24,38,0.98)",
    border: "rgba(255,255,255,0.05)",
    text: "#f1f5f9",
    textMuted: "#64748b",
    textFaint: "#2d3748",
    topbar: "rgba(8,10,20,0.98)",
    input: "rgba(255,255,255,0.03)",
  },
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://gps-backend-ec.onrender.com";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
const H = () => ({ "Content-Type": "application/json", "x-admin-token": getToken() || "" });

type ThemeCtx = { theme: Theme; t: typeof THEMES[Theme]; setTheme: (t: Theme) => void };
const ThemeContext = createContext<ThemeCtx>({
  theme: "dim", t: THEMES.dim, setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dim");

  // Cargar tema del backend al iniciar
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${BASE}/admin/preferences`, { headers: H() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.theme && THEMES[data.theme as Theme]) {
          setThemeState(data.theme as Theme);
        }
      })
      .catch(() => {});
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    // Guardar en backend
    fetch(`${BASE}/admin/preferences`, {
      method: "POST", headers: H(),
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ theme, t: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }