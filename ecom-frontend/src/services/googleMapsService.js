import { reverseGeocodeOpenStreetMap } from './openStreetMapService';

let googleMapsPromise;
let authFailureInstalled = false;

const apiKey = () => String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

export const loadGoogleMaps = () => {
  if (!authFailureInstalled) {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      window.dispatchEvent(new Event('google-maps-auth-error'));
      previous?.();
    };
    authFailureInstalled = true;
  }
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;
  const key = apiKey();
  if (!key) return Promise.reject(new Error('Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to your frontend environment.'));

  googleMapsPromise = new Promise((resolve, reject) => {
    const callback = `__googleMapsReady_${Date.now()}`;
    const script = document.createElement('script');
    window[callback] = () => {
      delete window[callback];
      resolve(window.google.maps);
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&libraries=places&callback=${callback}`;
    script.async = true;
    script.onerror = () => {
      delete window[callback];
      googleMapsPromise = null;
      reject(new Error('Google Maps could not be loaded. Check the API key, enabled APIs, billing, and website restrictions.'));
    };
    document.head.appendChild(script);
  });
  return googleMapsPromise;
};

export const getBrowserLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error('This browser does not support location access.'));
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
    reject,
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
  );
});

const componentValue = (components, type) => components?.find((item) => item.types?.includes(type))?.long_name || '';

export const normalizeGoogleResult = (result, coordinates) => {
  const components = result?.address_components || [];
  const lat = Number(coordinates?.lat ?? result?.geometry?.location?.lat?.());
  const lng = Number(coordinates?.lng ?? result?.geometry?.location?.lng?.());
  const city = componentValue(components, 'locality') || componentValue(components, 'postal_town') || componentValue(components, 'administrative_area_level_2');
  const title = result?.name || componentValue(components, 'sublocality_level_1') || componentValue(components, 'neighborhood') || city || 'Selected location';
  return {
    id: result?.place_id || `google-${lat.toFixed(6)}-${lng.toFixed(6)}`,
    provider: 'GOOGLE',
    providerPlaceId: result?.place_id || '',
    source: 'manual',
    title,
    subtitle: result?.formatted_address || title,
    address: result?.formatted_address || title,
    city,
    state: componentValue(components, 'administrative_area_level_1'),
    pincode: componentValue(components, 'postal_code'),
    country: componentValue(components, 'country'),
    latitude: lat,
    longitude: lng,
    coordinates: { lat, lng },
  };
};

export const reverseGeocodeLocation = async (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Invalid location coordinates.');
  const result = await reverseGeocodeOpenStreetMap(latitude, longitude);
  if (!result?.address) throw new Error('No readable address was found for this location.');
  return {
    ...result,
    id: `osm-${latitude.toFixed(6)}-${longitude.toFixed(6)}`,
    provider: 'OPENSTREETMAP',
    source: 'manual',
    latitude,
    longitude,
    coordinates: { lat: latitude, lng: longitude },
  };
};

export const getCurrentDeliveryLocation = async () => {
  const coordinates = await getBrowserLocation();
  const place = await reverseGeocodeLocation(coordinates.lat, coordinates.lng);
  return { ...place, source: 'gps' };
};

export const googleMapsConfigured = () => Boolean(apiKey());


