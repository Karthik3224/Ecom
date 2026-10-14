const authToken = () => sessionStorage.getItem('authToken') || '';

// A missing token, or one whose `exp` has passed, means the session is over — not a
// permission problem. Used to distinguish an expired session from a genuine 403.
const sessionIsStale = () => {
  const token = authToken();
  if (!token) return true;
  try {
    const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export class ApiError extends Error {
  constructor(message, status, payload, options) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export const apiRequest = async (baseUrl, path, options = {}) => {
  const requestToken = authToken();
  const timeout = AbortSignal.timeout(options.timeoutMs ?? (options.method && options.method !== 'GET' ? 30000 : 12000));
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response;
  try { response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.auth === false || !requestToken ? {} : { Authorization: `Bearer ${requestToken}` }),
      ...options.headers,
    },
  });
  } catch (error) {
    if (error.name === 'TimeoutError') throw new ApiError('The service took too long to respond. Please retry.', 504, null, { cause: error });
    throw error;
  }
  if (response.status === 204) return null;
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const authFailure = (response.status === 401 || response.status === 403) && options.auth !== false;
    const sessionExpired = authFailure && sessionIsStale();
    if (sessionExpired && options.expireSession !== false && requestToken === authToken()) window.dispatchEvent(new Event('customer-session-expired'));
    if (sessionExpired) throw new ApiError('Your session is no longer valid. Please sign in again.', response.status, payload);
    const validation = payload?.fields ? Object.values(payload.fields).join(' ') : '';
    const accessMessage = (response.status === 401 || response.status === 403) && options.auth === false ? 'The authentication service rejected this request. Please try again shortly.' : response.status === 401 || response.status === 403 ? 'This account does not have permission for this action. Please sign in again.' : '';
    const serverMessage = validation || payload?.message || (typeof payload === 'string' ? payload : '') || payload?.error;
    throw new ApiError(serverMessage || accessMessage || `Request failed (${response.status}).`, response.status, payload);
  }
  return payload;
};
