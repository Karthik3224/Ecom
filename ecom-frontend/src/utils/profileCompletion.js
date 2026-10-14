export const hasCompleteProfile = (user, addresses = []) => Boolean(
  user?.name?.trim() &&
  /^\+?[\d\s]{10,15}$/.test(user?.phone || '') &&
  addresses.length > 0
);

