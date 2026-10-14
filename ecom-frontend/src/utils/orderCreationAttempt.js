export const createOrderAttempt = async (data, send, storage = sessionStorage) => {
  const slot = `order-attempt:${data.customerId}:${data.storeId}`;
  const saved = JSON.parse(storage.getItem(slot) || 'null');
  // Checkout may regenerate its synthetic cart UUID after a lost response.
  // Preserve the original request while its outcome remains unresolved.
  const body = JSON.stringify(saved ? { ...data, cartId: JSON.parse(saved.body).cartId } : data);
  if (saved && saved.body !== body) {
    throw new Error('An earlier checkout has an unresolved result. Retry that checkout before changing the order.');
  }
  const attempt = saved || { body, key: crypto.randomUUID() };
  // Persist before sending: a lost response or page reload must reuse the key.
  storage.setItem(slot, JSON.stringify(attempt));
  let result;
  try { result = await send(body, attempt.key); }
  catch (error) {
    if ([400, 401, 403, 422].includes(error.status)) storage.removeItem(slot);
    throw error;
  }
  storage.removeItem(slot);
  return result;
};
