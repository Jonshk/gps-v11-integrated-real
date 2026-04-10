import type { MapStyle } from "react-map-gl/maplibre";

export const mapStyle: MapStyle = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO"
    }
  },
  layers: [
    {
      id: "carto-base",
      type: "raster",
      source: "carto",
      minzoom: 0,
      maxzoom: 20,
      paint: {
        "raster-saturation": -0.15,
        "raster-contrast": 0.2,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.85
      }
    }
  ]
};
