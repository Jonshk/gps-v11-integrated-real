import type { StyleSpecification } from "maplibre-gl";

export const mapStyle: StyleSpecification = {
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
        "raster-saturation": -0.05,
        "raster-contrast": 0.1,
        "raster-brightness-min": 0.28,
        "raster-brightness-max": 0.92
      }
    }
  ]
};