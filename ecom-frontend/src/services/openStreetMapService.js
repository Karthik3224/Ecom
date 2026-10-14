const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const reverseGeocodeCache = new Map();
let reverseGeocodeQueue = Promise.resolve();
let lastReverseRequestAt = 0;

const DEMO_LOCATIONS = [
  { id: 'demo-500018', title: 'Ameerpet', address: 'Ameerpet, Hyderabad, Telangana 500018, India', city: 'Hyderabad', state: 'Telangana', pincode: '500018', latitude: 17.4375, longitude: 78.4483, source: 'manual' },
  { id: 'demo-500038', title: 'SR Nagar', address: 'SR Nagar, Ameerpet, Hyderabad, Telangana 500038, India', city: 'Hyderabad', state: 'Telangana', pincode: '500038', latitude: 17.4419, longitude: 78.4483, source: 'manual' },
  { id: 'demo-500081', title: 'Madhapur', address: 'Madhapur, Hyderabad, Telangana 500081, India', city: 'Hyderabad', state: 'Telangana', pincode: '500081', latitude: 17.4483, longitude: 78.3915, source: 'manual' },
  { id: 'demo-500032', title: 'Gachibowli', address: 'Gachibowli, Hyderabad, Telangana 500032, India', city: 'Hyderabad', state: 'Telangana', pincode: '500032', latitude: 17.4401, longitude: 78.3489, source: 'manual' },
  { id: 'demo-500034', title: 'Banjara Hills', address: 'Banjara Hills, Hyderabad, Telangana 500034, India', city: 'Hyderabad', state: 'Telangana', pincode: '500034', latitude: 17.4123, longitude: 78.4482, source: 'manual' },
  { id: 'demo-500003', title: 'Secunderabad', address: 'Secunderabad, Hyderabad, Telangana 500003, India', city: 'Hyderabad', state: 'Telangana', pincode: '500003', latitude: 17.4399, longitude: 78.4983, source: 'manual' },
  { id: 'demo-516454', title: 'Simhadripuram', address: 'Simhadripuram, Kadapa, Andhra Pradesh 516454, India', city: 'Kadapa', state: 'Andhra Pradesh', pincode: '516454', latitude: 14.6206, longitude: 78.0739, source: 'manual' },
  { id: 'demo-andhra-pradesh', title: 'Andhra Pradesh', address: 'Andhra Pradesh, India', city: 'Andhra Pradesh', state: 'Andhra Pradesh', pincode: '', latitude: 15.9129, longitude: 79.74, source: 'manual' },
  { id: 'demo-vijayawada', title: 'Vijayawada', address: 'Vijayawada, Andhra Pradesh, India', city: 'Vijayawada', state: 'Andhra Pradesh', pincode: '', latitude: 16.5062, longitude: 80.6480, source: 'manual' },
  { id: 'demo-visakhapatnam', title: 'Visakhapatnam', address: 'Visakhapatnam, Andhra Pradesh, India', city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '', latitude: 17.6868, longitude: 83.2185, source: 'manual' },
];

const demoMatches = (query) => {
  const text = String(query || '').trim().toLowerCase();
  if (!text) return [];
  return DEMO_LOCATIONS.filter((place) =>
    place.pincode === text ||
    place.title.toLowerCase().includes(text) ||
    place.city.toLowerCase().includes(text) ||
    place.state.toLowerCase().includes(text) ||
    place.address.toLowerCase().includes(text)
  );
};

export const getDeliveryLocationSuggestions = (query) => demoMatches(query);

const fromIndiaPost = (row, pincode) => {
  const title = row.Name || row.Block || row.District || `Pincode ${pincode}`;
  const city = row.District || row.Block || row.Division || title;
  const state = row.State || '';
  const address = [title, city, state, pincode, 'India'].filter(Boolean).join(', ');
  return {
    id: `india-post-${pincode}-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title,
    subtitle: address,
    address,
    city,
    state,
    pincode,
    latitude: null,
    longitude: null,
    source: 'manual',
  };
};

const searchIndiaPostPincode = async (pincode, options = {}) => {
  const response = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`, options);
  if (!response.ok) throw new Error('Pincode lookup failed.');
  const data = await response.json();
  const offices = data?.[0]?.PostOffice;
  if (!Array.isArray(offices)) return [];
  return offices.slice(0, 6).map((office) => fromIndiaPost(office, pincode));
};

const normalizeAddress = (data) => {
  if (!data) return null;
  const address = data.address || {};
  return {
    title: address.suburb || address.neighbourhood || address.village || address.town || address.city || 'Current location',
    street: address.road || address.pedestrian || address.suburb || address.neighbourhood || address.village || '',
    houseNumber: address.house_number || '',
    subtitle: data.display_name || '',
    address: data.display_name || '',
    city: address.city || address.town || address.village || address.county || '',
    state: address.state || '',
    pincode: address.postcode || '',
  };
};

export const reverseGeocodeOpenStreetMap = (lat, lng, options = {}) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  if (reverseGeocodeCache.has(cacheKey)) return Promise.resolve(reverseGeocodeCache.get(cacheKey));

  const request = async () => {
    const waitMs = Math.max(0, 1000 - (Date.now() - lastReverseRequestAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastReverseRequestAt = Date.now();
    const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', lat: String(latitude), lon: String(longitude), zoom: '18', 'accept-language': 'en' });
    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, options);
    if (!response.ok) throw new Error('Location lookup failed.');
    const normalized = normalizeAddress(await response.json());
    if (normalized) reverseGeocodeCache.set(cacheKey, normalized);
    return normalized;
  };

  const queued = reverseGeocodeQueue.then(request, request);
  reverseGeocodeQueue = queued.catch(() => undefined);
  return queued;
};

export const geocodeOpenStreetMap = async (query) => {
  const response = await fetch(`${NOMINATIM_BASE}/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Address lookup failed.');
  const data = await response.json();
  return data[0] ? {
    ...normalizeAddress(data[0]),
    lat:Number(data[0].lat),
    lng:Number(data[0].lon),
    provider:'OPENSTREETMAP',
    providerPlaceId:String(data[0].place_id || ''),
    providerOsmType:data[0].osm_type || '',
    providerOsmId:String(data[0].osm_id || ''),
    locationAccuracyMeters:data[0].importance ? Math.max(10, Math.round((1 - Number(data[0].importance)) * 1000)) : null,
  } : null;
};

export const openStreetMapLocationUrl = ({ lat, lng, zoom = 17 }) => `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=${zoom}/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
export const openStreetMapDirectionsUrl = ({ origin, destination }) => `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(origin)}%3B${encodeURIComponent(destination)}`;
export const openStreetMapEmbedUrl = ({ lat, lng, delta = 0.012 }) => `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(lng-delta)}%2C${encodeURIComponent(lat-delta)}%2C${encodeURIComponent(lng+delta)}%2C${encodeURIComponent(lat+delta)}&layer=mapnik&marker=${encodeURIComponent(lat)}%2C${encodeURIComponent(lng)}`;

// Explicit searches only: no requests on every keystroke.
export const searchDeliveryLocations = async (query, options = {}) => {
  const localMatches = demoMatches(query);
  if (/^[1-9]\d{5}$/.test(query)) {
    try {
      const postalMatches = await searchIndiaPostPincode(query, options);
      if (postalMatches.length) {
        const enriched = await Promise.all(postalMatches.map(async (place) => {
          try {
            const geocoded = await geocodeOpenStreetMap(place.address);
            return geocoded ? { ...place, ...geocoded, id: place.id, source: 'manual', pincode: query } : place;
          } catch {
            return place;
          }
        }));
        const withCoordinates = enriched.filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
        if (withCoordinates.length) return withCoordinates;
      }
    } catch {
      if (localMatches.length) return localMatches;
    }
  }
  const params = new URLSearchParams({ format: 'json', addressdetails: '1', limit: '6', countrycodes: 'in' });
  if (/^[1-9]\d{5}$/.test(query)) {
    params.set('postalcode', query);
    params.set('country', 'India');
  } else params.set('q', /\bindia\b/i.test(query) ? query : `${query}, India`);
  try {
    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, options);
    if (!response.ok) throw new Error('Location lookup failed.');
    const rows = await response.json();
    const remoteMatches = rows.map((row) => ({ ...normalizeAddress(row), city: normalizeAddress(row).city || row.name || query,
      latitude: Number(row.lat), longitude: Number(row.lon), source: 'manual', id: String(row.place_id),
    })).filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
    const seen = new Set(localMatches.map((place) => place.id));
    return [...localMatches, ...remoteMatches.filter((place) => !seen.has(place.id))];
  } catch (error) {
    if (localMatches.length) return localMatches;
    throw error;
  }
};



