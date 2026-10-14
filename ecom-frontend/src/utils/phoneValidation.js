export const indianMobileDigits = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

export const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(indianMobileDigits(value));

export const formatIndianMobile = (value) => {
  const digits = indianMobileDigits(value);
  return /^[6-9]\d{9}$/.test(digits) ? `+91 ${digits}` : '';
};
