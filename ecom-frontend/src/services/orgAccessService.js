import { apiRequest } from './apiClient';
const ORG_ACCESS_BASE_URL = (import.meta.env.VITE_ORG_ACCESS_URL || '/org-access').replace(/\/$/, '');

const normalizeRole = (role) => {
  if (!role) return null;
  const value = String(role).trim();
  const withoutPrefix = value.startsWith('ROLE_') ? value.slice('ROLE_'.length) : value;
  const normalized = withoutPrefix.toLowerCase().replace(/_/g, '-');
  const map = {
    'super-admin': 'super-admin',
    'global-admin': 'global-admin',
    'location-admin': 'location-admin',
    'store-manager': 'store-manager',
    'delivery-partner': 'delivery-partner',
    'customer': 'customer',
  };
  return map[normalized] || normalized;
};

export const teamLandingPath = (role) => role === 'delivery-partner' ? '/delivery' : role === 'store-manager' ? '/store-manager/dashboard' : '/admin';

export const orgAccessService = {
  async login(username, password) {
    const payload = await apiRequest(ORG_ACCESS_BASE_URL, '/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username: String(username).trim(), password: String(password) }),
    });

    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    const user = await apiRequest(ORG_ACCESS_BASE_URL, '/api/users/me', { headers: { Authorization: `Bearer ${payload.token}` } });
    user.role = normalizeRole(user.role);

    return {
      user,
      token: payload.token || '',
      expiresInMillis: payload.expiresInMillis || 0,
      roles,
    };
  },
  async registerCustomer(customer) {
    return apiRequest(ORG_ACCESS_BASE_URL, '/api/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        confirmPassword: String(customer.confirmPassword || ''),
        email: String(customer.email).trim(),
        password: String(customer.password),
        name: String(customer.name).trim(),
        mobile: String(customer.mobile || customer.phone).trim(),
      }),
    });
  },
  async me() { return apiRequest(ORG_ACCESS_BASE_URL, '/api/users/me'); },
  async validate() { return apiRequest(ORG_ACCESS_BASE_URL, '/api/auth/validate'); },
  async createUser(user) {
    return apiRequest(ORG_ACCESS_BASE_URL, '/api/users', {
      method: 'POST',
      body: JSON.stringify({
        username:user.username || user.email,
        email:user.email,
        password:user.password,
        role:String(user.role || '').toUpperCase().replace(/-/g, '_'),
        name:user.name || null,
        mobile:user.mobile || user.phone || null,
        status:user.status || 'Active',
        organizationId:user.organizationId || 'metaarch-commerce',
        location:user.location || null,
        storeId:user.storeId || null,
        store:user.store || user.storeName || null,
        storeLocation:user.storeLocation || user.location || null,
        storeAddress:user.storeAddress || user.address || null,
        latitude:user.latitude === '' || user.latitude == null ? null : Number(user.latitude),
        longitude:user.longitude === '' || user.longitude == null ? null : Number(user.longitude),
        provider:user.provider || null,
        providerPlaceId:user.providerPlaceId || null,
        providerOsmType:user.providerOsmType || null,
        providerOsmId:user.providerOsmId || null,
        locationAccuracyMeters:user.locationAccuracyMeters === '' || user.locationAccuracyMeters == null ? null : Number(user.locationAccuracyMeters),
        assignedBy:user.assignedBy || null,
      }),
    });
  },
  async changePassword({ currentPassword, newPassword }) {
    return apiRequest(ORG_ACCESS_BASE_URL, '/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};
