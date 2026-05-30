'use client'
// useClientSession.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Va en: Fronted/lib/useClientSession.ts  (CREAR)

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface FleetVehicle {
  id: string
  device_id: string
  name: string
  plate: string
  phone?: string
  lat?: number
  lng?: number
  speed?: number
  heading?: number
  battery?: number
  status?: 'active' | 'idle' | 'offline'
}

export interface ClientSession {
  client_id: string
  client_name: string
  username: string
  account_type: 'individual' | 'fleet'
  ws_token: string
  token: string
  phone?: string
  vehicle_id?: string
  sim_number?: string
  vehicles: FleetVehicle[]
}

export function useClientSession() {
  const router = useRouter()
  const [session, setSession] = useState<ClientSession | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('gps_session')
    if (!raw) { router.push('/client/login'); return }
    try { setSession(JSON.parse(raw)) }
    catch { router.push('/client/login') }
  }, [])

  function logout() {
    sessionStorage.removeItem('gps_session')
    router.push('/client/login')
  }

  return { session, logout }
}

export const STATUS_COLOR: Record<string, string> = {
  active: '#22c55e', idle: '#f59e0b', offline: '#ef4444',
}
export const STATUS_LABEL: Record<string, string> = {
  active: 'En ruta', idle: 'Detenido', offline: 'Sin señal',
}

export const API    = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL  || 'ws://localhost:8000'