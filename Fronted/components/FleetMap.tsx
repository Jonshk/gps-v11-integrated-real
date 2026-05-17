"use client";

import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import { mapStyle } from "@/lib/mapStyle";
import type { FleetVehicle } from "@/lib/fleet";

type Props = {
  vehicles: FleetVehicle[];
};

function getCenter(vehicles: FleetVehicle[]) {
  if (vehicles.length === 0) {
    return { longitude: -79.8895, latitude: -2.1704, zoom: 11.8 };
  }

  const avgLng = vehicles.reduce((sum, v) => sum + v.lng, 0) / vehicles.length;
  const avgLat = vehicles.reduce((sum, v) => sum + v.lat, 0) / vehicles.length;
  return { longitude: avgLng, latitude: avgLat, zoom: 12.2 };
}

export default function FleetMap({ vehicles }: Props) {
  const center = getCenter(vehicles);

  return (
    <div className="live-map-wrap">
      <Map
        initialViewState={{
          longitude: center.longitude,
          latitude: center.latitude,
          zoom: center.zoom,
          pitch: 48,
          bearing: -12
        }}
        mapStyle={mapStyle}
        attributionControl={false}
        dragRotate={false}
        touchZoomRotate={false}
        reuseMaps
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" visualizePitch={false} showCompass={false} />

        {vehicles.map((vehicle) => (
          <Marker key={vehicle.id} longitude={vehicle.lng} latitude={vehicle.lat} anchor="center">
            <div className={`marker ${vehicle.status}`}>
              <span className="ring" />
              <span className="dot" />
            </div>
          </Marker>
        ))}
      </Map>

      <div className="map-overlay" />
    </div>
  );
}
