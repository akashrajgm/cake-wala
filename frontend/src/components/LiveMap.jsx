import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Curated SVG markers for perfect Vite compatibility and premium aesthetics
const BAKERY_SVG = `
  <div style="background-color: var(--color-text); width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
    <span style="font-size: 18px;">🍰</span>
  </div>
`;

const CUSTOMER_SVG = `
  <div style="background-color: var(--color-primary); width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
    <span style="font-size: 18px;">🏠</span>
  </div>
`;

const RIDER_SVG = `
  <div style="background-color: var(--color-accent); width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(225, 177, 44, 0.45); animation: pulseSteam 1.5s ease-in-out infinite;">
    <span style="font-size: 20px;">🛵</span>
  </div>
`;

export default function LiveMap({ bakeryLat, bakeryLng, customerLat, customerLng, riderLat, riderLng }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Map
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([bakeryLat, bakeryLng], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Add Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 2. Add Bakery Marker
      const bakeryIcon = L.divIcon({
        html: BAKERY_SVG,
        className: 'custom-leaflet-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([bakeryLat, bakeryLng], { icon: bakeryIcon })
        .addTo(map)
        .bindPopup("<b>Cake-Wala Bakery HQ</b><br/>Baking fresh batches!")
        .openPopup();

      // 3. Add Customer Marker
      const customerIcon = L.divIcon({
        html: CUSTOMER_SVG,
        className: 'custom-leaflet-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([customerLat, customerLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup("<b>Your Doorstep</b><br/>Gourmet order destination");

      // 4. Add Driver Marker
      const riderIcon = L.divIcon({
        html: RIDER_SVG,
        className: 'custom-leaflet-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const riderMarker = L.marker([riderLat, riderLng], { icon: riderIcon })
        .addTo(map)
        .bindPopup("<b>Express Rider</b><br/>Your fresh cake is on the way!");
      
      riderMarkerRef.current = riderMarker;
      mapRef.current = map;

      // Fit bounds to contain both points on startup
      const bounds = L.latLngBounds([
        [bakeryLat, bakeryLng],
        [customerLat, customerLng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, []);

  // Update Rider Marker position dynamically when props change
  useEffect(() => {
    if (mapRef.current && riderMarkerRef.current && riderLat && riderLng) {
      // Easing/glide movement
      riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      
      // Keep rider in view
      const map = mapRef.current;
      const bounds = L.latLngBounds([
        [bakeryLat, bakeryLng],
        [customerLat, customerLng],
        [riderLat, riderLng]
      ]);
      map.panTo([riderLat, riderLng]);
    }
  }, [riderLat, riderLng]);

  return (
    <div style={styles.mapWrapper} className="nav-shadow">
      <div ref={mapContainerRef} style={styles.mapContainer} />
    </div>
  );
}

const styles = {
  mapWrapper: {
    width: '100%',
    height: '320px',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1.5px solid var(--color-card-border)',
    backgroundColor: '#EAE5DB',
    position: 'relative',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
};
 L.Icon.Default.imagePath = ''; // Suppress default Leaflet image checks
