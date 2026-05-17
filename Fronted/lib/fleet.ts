export type FleetVehicle = {
  id: string;
  name: string;
  status: "active" | "idle" | "offline";
  lat: number;
  lng: number;
  speed: number;
  geofence: string | null;
  updatedAt: string;
};

export type FleetMetrics = {
  active: number;
  idle: number;
  offline: number;
  alerts: number;
  routes: number;
};

export type FleetAlert = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  severity: "low" | "medium" | "high";
};

export type FleetPayload = {
  vehicles: FleetVehicle[];
  alerts: FleetAlert[];
  metrics: FleetMetrics;
};
