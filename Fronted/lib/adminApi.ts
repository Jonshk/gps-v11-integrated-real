// lib/adminApi.ts
const BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-admin-token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin";
    }
    throw new Error("No autorizado");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  login: (password: string) =>
    req<{ ok: boolean; token: string }>("POST", "/admin/login", { password }),

  logout: () => req("POST", "/admin/logout"),

  // Dispositivos GPS
  getDevices: () => req<GpsDevice[]>("GET", "/admin/devices"),
  createDevice: (data: Partial<GpsDevice>) =>
    req<GpsDevice>("POST", "/admin/devices", data),
  updateDevice: (id: string, data: Partial<GpsDevice>) =>
    req<GpsDevice>("PATCH", `/admin/devices/${id}`, data),
  deleteDevice: (id: string) =>
    req("DELETE", `/admin/devices/${id}`),

  // Clientes
  getClients: () => req<AppClient[]>("GET", "/admin/clients"),
  createClient: (data: Partial<AppClient>) =>
    req<AppClient>("POST", "/admin/clients", data),
  updateClient: (id: string, data: Partial<AppClient>) =>
    req<AppClient>("PATCH", `/admin/clients/${id}`, data),
  deleteClient: (id: string) =>
    req("DELETE", `/admin/clients/${id}`),
  toggleClient: (id: string) =>
    req<AppClient>("POST", `/admin/clients/${id}/toggle`),

  // Vehículos (lista para selects)
  getVehicles: () => req<Vehicle[]>("GET", "/vehicles"),
};

// ── Tipos ─────────────────────────────────────────────────────────────────

export type GpsDevice = {
  id: string;
  name: string;
  sim_number: string;
  model?: string;
  imei?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  client_name?: string;
  username?: string;
  active: number;
  notes?: string;
  created_at: string;
};

export type AppClient = {
  id: string;
  username: string;
  password: string;
  client_name: string;
  email?: string;
  phone?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  gps_device_id?: string;
  device_name?: string;
  sim_number?: string;
  device_model?: string;
  active: number;
  created_at: string;
};

export type Vehicle = {
  id: string;
  name: string;
  status: string;
  lat: number;
  lng: number;
};