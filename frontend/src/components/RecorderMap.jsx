import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;

const createColoredMarker = (status, isSelected) => {
  const isAlert = status === 'ALERT';
  const color = isAlert ? '#ef4444' : '#10b981';
  const glow = isAlert ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.5)';
  const pulse = isAlert ? 'animate-pulse' : '';

  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: ${isSelected ? '34px' : '26px'};
        height: ${isSelected ? '34px' : '26px'};
        border-radius: 50%;
        background: ${glow};
        filter: blur(${isSelected ? '4px' : '3px'});
      " class="${pulse}"></div>
      <div style="
        position: relative;
        width: ${isSelected ? '22px' : '18px'};
        height: ${isSelected ? '22px' : '18px'};
        border-radius: 50%;
        background: ${color};
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export default function RecorderMap({ recorders, selectedIndex, onSelectRecorder }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([20.0, 78.0], 5);

      // Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map alive or cleanup on unmount
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (!recorders || recorders.length === 0) {
      map.setView([20.0, 78.0], 5);
      return;
    }

    const bounds = L.latLngBounds();

    recorders.forEach((rec, idx) => {
      const isSelected = idx === selectedIndex;
      const marker = L.marker([rec.lat, rec.lon], {
        icon: createColoredMarker(rec.status, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      });

      const popupContent = `
        <div style="padding: 4px; font-size: 13px; line-height: 1.4;">
          <div style="font-weight: 700; color: #f1f5f9; font-size: 14px; margin-bottom: 4px;">
            ${rec.name || rec.filename}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="
              display: inline-block;
              padding: 2px 8px;
              border-radius: 9999px;
              font-weight: 700;
              font-size: 11px;
              letter-spacing: 0.05em;
              background: ${rec.status === 'ALERT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'};
              color: ${rec.status === 'ALERT' ? '#f87171' : '#34d399'};
              border: 1px solid ${rec.status === 'ALERT' ? '#ef4444' : '#10b981'};
            ">
              ${rec.status === 'ALERT' ? 'THREAT DETECTED' : 'NORMAL / OK'}
            </span>
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            <div>Coords: ${rec.lat.toFixed(4)}, ${rec.lon.toFixed(4)}</div>
            ${rec.alerts?.length ? `<div style="color: #f87171; font-weight: 600;">Alerts: ${rec.alerts.length}</div>` : ''}
            <div>Species: ${rec.species_count ?? 0} | Shannon: ${rec.shannon ?? 0}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectRecorder) onSelectRecorder(idx);
      });

      marker.addTo(markersLayer);
      bounds.extend([rec.lat, rec.lon]);
    });

    if (recorders.length > 0) {
      if (recorders.length === 1) {
        map.setView([recorders[0].lat, recorders[0].lon], 9);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [recorders, selectedIndex, onSelectRecorder]);

  // When selected recorder changes, pan smoothly
  useEffect(() => {
    if (mapInstanceRef.current && recorders && recorders[selectedIndex]) {
      const rec = recorders[selectedIndex];
      mapInstanceRef.current.panTo([rec.lat, rec.lon], { animate: true, duration: 0.6 });
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full h-[360px] rounded-xl overflow-hidden border border-emerald-900/40 shadow-xl bg-[#09130e]">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-[1000] bg-forest-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-800/40 text-xs flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30"></span>
          <span className="text-emerald-200">OK / Safe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/40 animate-pulse"></span>
          <span className="text-red-300">ALERT</span>
        </div>
      </div>
    </div>
  );
}
