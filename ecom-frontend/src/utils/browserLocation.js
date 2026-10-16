export async function browserLocation(browser = globalThis) {
  if (browser.isSecureContext === false) throw new Error('Location access requires HTTPS. Search for your address manually.');
  const nav = browser.navigator;
  if (!nav?.geolocation) throw new Error('Location is unavailable. Search for your address manually.');
  let permission;
  try { permission = await nav.permissions?.query({ name: 'geolocation' }); } catch { /* Some browsers do not implement this permission query. */ }
  if (permission?.state === 'denied') throw new Error('Location is blocked. Change browser site settings or search manually.');
  return new Promise((resolve, reject) => nav.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
    error => reject(new Error(error.code === 1 ? 'Location permission was not granted. Search for your address manually.' : 'Location is unavailable. Search manually or try again.')),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
  ));
}
