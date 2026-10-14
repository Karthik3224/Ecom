const KEY = 'selectedLocation';
export const validLocation = (value) => Boolean(value &&
  ['manual', 'gps'].includes(value.source) &&
  ((typeof value.city === 'string' && value.city.trim()) || (typeof value.address === 'string' && value.address.trim()) || (typeof value.title === 'string' && value.title.trim())) &&
  Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
  Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180
);

export const readSelectedLocation = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return validLocation(value) ? value : null;
  } catch { return null; }
};

export const storeSelectedLocation = (value) => {
  if (!validLocation(value)) throw new Error('Please enter a valid location.');
  localStorage.setItem(KEY, JSON.stringify(value));
};
