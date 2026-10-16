import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { colorPorCultivo, emojiPorCultivo, tipoEspacioLabel, cultivoLabel } from '../lib/catalog';
import { formatNumber } from '../lib/format';
import type { Coordinates, MapPoint } from '../lib/types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPopup(point: MapPoint): string {
  const rows = [
    `<div>🐝 <strong>${escapeHtml(point.polinizador_principal ?? 'Polinizador nativo')}</strong></div>`,
    `<div>⭐ ${formatNumber(point.puntos)} puntos acumulados</div>`,
    point.certificado
      ? '<div style="color:#7d621a;font-weight:600">🏅 Polinizador Amigo</div>'
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `
    <div style="min-width:190px">
      <strong style="font-size:14px">${escapeHtml(point.nombre ?? 'Espacio sin nombre')}</strong>
      <div style="color:#63625a;font-size:12px;margin-top:2px">
        ${escapeHtml(tipoEspacioLabel(point.tipo))} · ${escapeHtml(cultivoLabel(point.cultivo))}
      </div>
      <div style="margin-top:10px;font-size:12px;display:grid;gap:4px">${rows}</div>
    </div>
  `;
}

function buildIcon(point: MapPoint): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="pin${point.certificado ? ' pin--certified' : ''}" style="background:${colorPorCultivo(
      point.cultivo
    )}"><span>${emojiPorCultivo(point.cultivo)}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

export interface MapViewProps {
  points: MapPoint[];
  center?: Coordinates;
  zoom?: number;
}

/** Mapa Leaflet con pines coloreados por cultivo. */
export function MapView({ points, center, zoom = 12 }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([center?.lat ?? 12.9255, center?.lng ?? -85.9178], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // Solo se inicializa una vez; los puntos se actualizan en el otro efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (points.length === 0) return;

    const corners: L.LatLngExpression[] = [];

    points.forEach((point) => {
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;

      L.marker([point.lat, point.lng], { icon: buildIcon(point), title: point.nombre ?? '' })
        .bindPopup(buildPopup(point))
        .addTo(layer);

      corners.push([point.lat, point.lng]);
    });

    if (corners.length === 1) {
      map.setView(corners[0], 14);
    } else if (corners.length > 1) {
      map.fitBounds(L.latLngBounds(corners).pad(0.25), { maxZoom: 14 });
    }
  }, [points]);

  return <div ref={containerRef} className="map-canvas" role="application" aria-label="Mapa de espacios registrados" />;
}
