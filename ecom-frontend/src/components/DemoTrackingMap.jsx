import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { loadGoogleMaps } from '../services/googleMapsService';

const point = (location) => {
  if (location?.latitude == null || location?.longitude == null) return null;
  const lat = Number(location.latitude);
  const lng = Number(location.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
};

export default function DemoTrackingMap({ store, destination, demo = true }) {
  const node = useRef(null);
  const [error, setError] = useState('');
  const storeLatitude = store?.latitude;
  const storeLongitude = store?.longitude;
  const storeName = store?.name;
  const destinationLatitude = destination?.latitude;
  const destinationLongitude = destination?.longitude;
  useEffect(() => {
    const storePoint = point({ latitude: storeLatitude, longitude: storeLongitude });
    const deliveryPoint = point({ latitude: destinationLatitude, longitude: destinationLongitude });
    if (!storePoint && !deliveryPoint) return undefined;
    let ignore = false;
    const markers = [];
    const authorizationFailed = () => setError('Google Maps access was denied. Check the API key website restrictions for this address.');
    window.addEventListener('google-maps-auth-error', authorizationFailed);
    const timeout = window.setTimeout(() => { if (!ignore) setError('Google Maps is taking too long to load.'); }, 15000);
    loadGoogleMaps().then((maps) => {
      if (ignore) return;
      window.clearTimeout(timeout);
      const map = new maps.Map(node.current, { center: storePoint || deliveryPoint, zoom: 14, mapTypeControl: false, streetViewControl: false, fullscreenControl: true });
      const bounds = new maps.LatLngBounds();
      for (const [position, label, title] of [[storePoint, 'S', storeName || 'Store'], [deliveryPoint, 'H', 'Delivery address']]) {
        if (!position) continue;
        markers.push(new maps.Marker({ map, position, label, title }));
        bounds.extend(position);
      }
      if (storePoint && deliveryPoint) map.fitBounds(bounds, 48);
      setError('');
    }).catch((reason) => { if (!ignore) { window.clearTimeout(timeout); setError(reason.message || 'Map unavailable.'); } });
    return () => { ignore = true; window.removeEventListener('google-maps-auth-error', authorizationFailed); window.clearTimeout(timeout); markers.forEach((marker) => marker.setMap(null)); };
  }, [storeLatitude, storeLongitude, storeName, destinationLatitude, destinationLongitude]);
  if (!point(store) && !point(destination)) return <Alert severity="info">Map locations are not recorded for this {demo ? 'demo ' : ''}order.</Alert>;
  return <Box sx={{ position: 'relative', mt: 2 }}>
    <Box ref={node} aria-label="Store and delivery address map" sx={{ height: { xs: 280, md: 360 }, width: '100%', bgcolor: '#eef2f3', borderRadius: 1, overflow: 'hidden' }} />
    {error && <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert>}
    <Typography variant="caption" color="text.secondary">Store and delivery address only. No live rider location is available.</Typography>
  </Box>;
}
