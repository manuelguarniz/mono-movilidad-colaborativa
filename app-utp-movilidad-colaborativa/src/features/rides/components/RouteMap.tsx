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
import type { GeoPoint, RideDirection, RoutePoint } from "@/features/rides/types";

type RouteMapProps = {
  campus: { label: string; location: GeoPoint };
  home: RoutePoint | null;
  // En orden de la casa a la sede.
  stops: RoutePoint[];
  direction: RideDirection;
  // Cambia para volver a encuadrar la ruta.
  fitKey: number;
  onTap: (location: GeoPoint) => void;
  onMovePoint: (pointId: string, location: GeoPoint) => void;
};

/** Mapa editable de «Publicar viaje»: se toca para agregar puntos y se arrastran para moverlos. */
export function RouteMap({
  campus,
  home,
  stops,
  direction,
  fitKey,
  onTap,
  onMovePoint,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // El mapa se crea una sola vez; los manejadores siempre leen la última versión.
  const handlersRef = useRef({ onTap, onMovePoint });
  handlersRef.current = { onTap, onMovePoint };

  useEffect(() => {
    const map = createBaseMap(containerRef.current!);

    map.on("click", (event) => {
      handlersRef.current.onTap({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }
    layer.clearLayers();

    drawRouteLine(
      [
        ...(home ? [home.location] : []),
        ...stops.map((stop) => stop.location),
        campus.location,
      ],
      layer,
    );

    addMarkerLabel(
      L.marker(toLatLng(campus.location), {
        icon: markerIcon("route-marker-campus", capIcon, 36),
        interactive: false,
        keyboard: false,
      }),
      campus.label,
    ).addTo(layer);

    const addDraggable = (point: RoutePoint, icon: L.DivIcon) => {
      const marker = L.marker(toLatLng(point.location), { icon, draggable: true });
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        handlersRef.current.onMovePoint(point.id, { lat, lng });
      });
      addMarkerLabel(marker, point.label).addTo(layer);
    };

    if (home) {
      // La casa es el origen en la ida y el destino en el regreso.
      const letter = direction === "TO_CAMPUS" ? "A" : "B";
      addDraggable(home, markerIcon("route-marker-home", letter, 36));
    }
    stops.forEach((stop) =>
      addDraggable(stop, markerIcon("route-marker-stop", "", 24)),
    );
  }, [campus, home, stops, direction]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    fitMapToPoints(mapRef.current, [
      campus.location,
      ...(home ? [home.location] : []),
      ...stops.map((stop) => stop.location),
    ]);
    // Solo se vuelve a encuadrar cuando lo pide la pantalla, no en cada cambio de la ruta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, campus]);

  return <div ref={containerRef} className="h-full w-full" />;
}
