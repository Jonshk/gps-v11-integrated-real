import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: "GPS Control EC -- Seguimiento de flota en tiempo real",
  description: "Plataforma GPS para control de flotas en Ecuador. Ubicacion en tiempo real, geocercas, alertas y panel operativo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}