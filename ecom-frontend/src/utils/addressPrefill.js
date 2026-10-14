export const addressFieldsFromLocation = (location = {}) => ({
  street: location.street || location.road || location.area || location.title || '',
  city: location.city || '',
  state: location.state || '',
  pincode: location.pincode || location.postcode || '',
});

export const fillMissingAddressFields = (current, location) => {
  const detected = addressFieldsFromLocation(location);
  return Object.fromEntries(Object.keys(detected).map((key) => [key, current[key] || detected[key]]));
};
