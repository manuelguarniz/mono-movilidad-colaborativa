import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/features/rides/types";

// Piezas comunes de los mapas de viajes: Leaflet con teselas de OpenStreetMap. Los puntos
// se unen con líneas rectas; el trazado por calles queda para un próximo alcance.

export const toLatLng = (point: GeoPoint): L.LatLngTuple => [point.lat, point.lng];

export function createBaseMap(container: HTMLElement) {
  const map = L.map(container, { zoomControl: false });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  return map;
}

export const markerIcon = (className: string, html: string, size: number) =>
  L.divIcon({
    className: "",
    html: `<span class="route-marker ${className}">${html}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

/** Etiqueta siempre visible bajo el marcador. */
export const addMarkerLabel = (marker: L.Marker, label: string, className = "") =>
  marker.bindTooltip(label || "Sin nombre", {
    permanent: true,
    direction: "bottom",
    offset: [0, 14],
    className: `route-map-label ${className}`,
  });

export function drawRouteLine(points: GeoPoint[], layer: L.LayerGroup) {
  if (points.length < 2) {
    return;
  }
  const path = points.map(toLatLng);
  L.polyline(path, { color: "#bd0016", weight: 6, opacity: 0.9 }).addTo(layer);
  L.polyline(path, { color: "#ffffff", weight: 2, dashArray: "6 10" }).addTo(layer);
}

/** Encuadra los puntos; con uno solo, lo centra. */
export function fitMapToPoints(map: L.Map, points: GeoPoint[]) {
  if (points.length === 1) {
    map.setView(toLatLng(points[0]), 15);
  } else if (points.length > 1) {
    map.fitBounds(L.latLngBounds(points.map(toLatLng)), { padding: [56, 56] });
  }
}
