from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field

VehicleStatus = Literal["active", "idle", "offline"]
AlertSeverity = Literal["low", "medium", "high"]

class VehicleCreate(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    status: VehicleStatus
    lat: float
    lng: float
    speed: float = 0
    geofence: Optional[str] = None

class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[VehicleStatus] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    speed: Optional[float] = None
    geofence: Optional[str] = None

class PositionCreate(BaseModel):
    lat: float
    lng: float
    speed: float = 0
    geofence: Optional[str] = None

class AlertCreate(BaseModel):
    id: str
    type: str
    message: str
    severity: AlertSeverity

class FleetMetrics(BaseModel):
    active: int
    idle: int
    offline: int
    alerts: int
    routes: int

class FleetVehicle(BaseModel):
    id: str
    name: str
    status: VehicleStatus
    lat: float
    lng: float
    speed: float
    geofence: Optional[str] = None
    updatedAt: str

class FleetAlert(BaseModel):
    id: str
    type: str
    message: str
    createdAt: str
    severity: AlertSeverity

class FleetResponse(BaseModel):
    vehicles: list[FleetVehicle]
    alerts: list[FleetAlert]
    metrics: FleetMetrics
