import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Button } from './ui/Button';
import type { Coordinates } from '../lib/types';

/** Marcador del selector: pin circular reutilizando los estilos `.pin`. */
function buildPickerIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: '<div class="pin pin--picker"><span>📍</span></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;

export interface LocationPickerProps {
  /** Coordenada marcada, o null si todavía no se ubica el espacio. */
  value: Coordinates | null;
  /** Encuadre inicial/objetivo del mapa (normalmente el centro del país elegido). */
  center: Coordinates;
  /** Zoom objetivo del encuadre. */
  zoom?: number;
  /** Se dispara al marcar, arrastrar o quitar el punto. */
  onChange: (coords: Coordinates | null) => void;
  /** Punto de referencia a mostrar (por ejemplo, el centro del país). */
  referenceLabel?: string;
  /** Solo consulta: muestra la ubicación registrada sin permitir editarla. */
  readOnly?: boolean;
}

/**
 * Mapa interactivo para ubicar el espacio: la persona toca el mapa o arrastra
 * el pin en lugar de escribir latitud y longitud a mano.
 *
 * Con `readOnly` se reutiliza para mostrar la ubicación ya registrada (por
 * ejemplo, en el monitoreo, que hereda la ubicación de la segmentación).
 */
export function LocationPicker({
  value,
  center,
  zoom = 12,
  onChange,
  referenceLabel,
  readOnly = false,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  /* -------------------------------------------------------------- Inicialización */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([center.lat, center.lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Un toque en el mapa fija (o mueve) el punto del espacio.
    if (!readOnly) {
      map.on('click', (event: L.LeafletMouseEvent) => {
        onChangeRef.current({
          lat: round(event.latlng.lat),
          lng: round(event.latlng.lng),
        });
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // El mapa se crea una sola vez; el encuadre y el pin se sincronizan abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------------- Sincroniza pin */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng], {
        icon: buildPickerIcon(),
        draggable: !readOnly,
        title: readOnly ? 'Ubicación registrada del espacio' : 'Arrastra para ajustar la ubicación',
      }).addTo(map);

      markerRef.current.on('dragend', () => {
        const position = markerRef.current?.getLatLng();
        if (position) {
          onChangeRef.current({ lat: round(position.lat), lng: round(position.lng) });
        }
      });
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
  }, [value, readOnly]);

  /* ------------------------------------------------- Vuela al país cuando cambia */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || value) return; // No interrumpir si ya hay un punto marcado.
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom]);

  /* ------------------------------------------------------- Ajusta el tamaño real */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setGeoError('Tu navegador no permite obtener la ubicación actual.');
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: round(position.coords.latitude),
          lng: round(position.coords.longitude),
        };
        onChangeRef.current(coords);
        mapRef.current?.flyTo([coords.lat, coords.lng], 16, { duration: 0.9 });
        setLocating(false);
      },
      () => {
        setGeoError('No pudimos obtener tu ubicación. Marca el punto tocando el mapa.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="location-picker">
      <div className="location-picker__frame">
        <div
          ref={containerRef}
          className={
            readOnly
              ? 'location-picker__canvas location-picker__canvas--readonly'
              : 'location-picker__canvas'
          }
          role="application"
          aria-label="Mapa interactivo para ubicar tu espacio"
        />

        {!value ? (
          <div className="location-picker__hint" aria-hidden>
            <span className="location-picker__hint-icon">👆</span>
            {readOnly
              ? 'Este espacio no tiene ubicación registrada'
              : 'Toca el mapa para ubicar tu espacio'}
          </div>
        ) : null}

        {referenceLabel ? (
          <span className="location-picker__badge">🧭 {referenceLabel}</span>
        ) : null}
      </div>

      <div className="location-picker__toolbar">
        {readOnly ? (
          value ? (
            <span className="location-picker__coords" role="status">
              <span className="mono">{value.lat.toFixed(5)}</span>
              <span className="location-picker__coords-sep">,</span>
              <span className="mono">{value.lng.toFixed(5)}</span>
            </span>
          ) : (
            <span className="location-picker__empty">
              Actualiza la ubicación en la segmentación para verla aquí.
            </span>
          )
        ) : (
          <>
            <Button variant="outlined" size="sm" iconLeft="🎯" onClick={useMyLocation} disabled={locating}>
              {locating ? 'Buscando…' : 'Usar mi ubicación'}
            </Button>

            {value ? (
              <>
                <span className="location-picker__coords" role="status">
                  <span className="mono">{value.lat.toFixed(5)}</span>
                  <span className="location-picker__coords-sep">,</span>
                  <span className="mono">{value.lng.toFixed(5)}</span>
                </span>
                <Button variant="ghost" size="sm" iconLeft="✕" onClick={() => onChange(null)}>
                  Quitar punto
                </Button>
              </>
            ) : (
              <span className="location-picker__empty">
                Sin coordenadas · puedes registrar el espacio igual y ubicarlo después.
              </span>
            )}
          </>
        )}
      </div>

      {geoError ? <span className="field__error">{geoError}</span> : null}
    </div>
  );
}

export default LocationPicker;
