import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  addMarkerLabel,
  createBaseMap,
  drawRouteLine,
  fitMapToPoints,
  markerIcon,
  toLatLng,
} from "@/features/rides/components/leafletMap";
import type { Place } from "@/features/rides/types";

type RideRouteMapProps = {
  origin: Place;
  stops: Place[];
  destination: Place;
  // Cambia para volver a encuadrar la ruta.
  fitKey: number;
};

/** Mapa de solo lectura del detalle de un viaje: partida (A), paradas y destino (B). */
export function RideRouteMap({ origin, stops, destination, fitKey }: RideRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const map = createBaseMap(containerRef.current!);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      return;
    }
    layer.clearLayers();

    const route = [origin, ...stops, destination];
    drawRouteLine(
      route.map((place) => place.location),
      layer,
    );

    const addPlace = (place: Place, className: string, html: string, size: number) =>
      addMarkerLabel(
        L.marker(toLatLng(place.location), {
          icon: markerIcon(className, html, size),
          interactive: false,
          keyboard: false,
        }),
        place.label,
        "route-map-label-dark",
      ).addTo(layer);

    stops.forEach((stop) => addPlace(stop, "route-marker-stop", "", 24));
    addPlace(origin, "route-marker-origin", "A", 36);
    addPlace(destination, "route-marker-destination", "B", 36);

    fitMapToPoints(
      map,
      route.map((place) => place.location),
    );
  }, [origin, stops, destination, fitKey]);

  return <div ref={containerRef} className="h-full w-full" />;
}
