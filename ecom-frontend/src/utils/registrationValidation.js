export const validRegistrationName = (value) => {
  const name = String(value || '').trim();
  return name.length <= 120 && /^[\p{L}\p{M} .'\u2019-]+$/u.test(name) && (name.match(/\p{L}/gu) || []).length >= 3;
};

export const validRegistrationGmail = (value) => {
  const email = String(value || '').trim();
  return email.length <= 190 && /^[a-z0-9]+(?:\.[a-z0-9]+)*@gmail\.com$/i.test(email);
};
