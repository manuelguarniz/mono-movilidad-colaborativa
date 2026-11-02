import { useEffect, useRef } from "react";
import L from "leaflet";
import capIcon from "@/assets/images/icons/graduation-cap.svg?raw";
import {
  addMarkerLabel,
  createBaseMap,
  drawRouteLine,
  fitMapToPoints,
  markerIcon,
  toLatLng,
} from "@/features/rides/components/leafletMap";
import type { Place, RideDirection } from "@/features/rides/types";

type RideRouteMapProps = {
  origin: Place;
  stops: Place[];
  destination: Place;
  // La sede es el origen en el regreso y el destino en la ida: lleva el birrete.
  direction: RideDirection;
  // Cambia para volver a encuadrar la ruta.
  fitKey: number;
};

/**
 * Mapa de solo lectura del detalle de un viaje (frame 09-A), con los marcadores de «Publicar
 * viaje»: origen con anillo rojo, paradas numeradas y destino rojo sólido, unidos por líneas
 * rectas punteadas.
 */
export function RideRouteMap({
  origin,
  stops,
  destination,
  direction,
  fitKey,
}: RideRouteMapProps) {
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
      "dashed",
    );

    const addPlace = (place: Place, className: string, html: string, size: number) =>
      addMarkerLabel(
        L.marker(toLatLng(place.location), {
          icon: markerIcon(className, html, size),
          interactive: false,
          keyboard: false,
        }),
        place.label,
      ).addTo(layer);

    const isToCampus = direction === "TO_CAMPUS";
    stops.forEach((stop, index) =>
      addPlace(stop, "route-marker-stop-number", String(index + 1), 26),
    );
    addPlace(origin, "route-marker-start", isToCampus ? "" : capIcon, 36);
    addPlace(destination, "route-marker-end", isToCampus ? capIcon : "", 32);

    fitMapToPoints(
      map,
      route.map((place) => place.location),
    );
  }, [origin, stops, destination, direction, fitKey]);

  return <div ref={containerRef} className="h-full w-full" />;
}
