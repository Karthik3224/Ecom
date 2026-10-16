// The server enforces role and store scope. Never fall back to browser-local orders.
export async function loadManagerOrders(storeId, request) {
  if (!storeId) throw new Error('No store is assigned to this manager.');
  const rows = await request({ storeId });
  if (!Array.isArray(rows)) throw new Error('Unexpected order response. Please retry.');
  if (rows.some(order => order.storeId !== storeId)) throw new Error('Order store assignment could not be verified.');
  return rows;
}
