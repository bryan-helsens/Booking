import axios from 'axios';

const TENANT_KEY = 'booking.tenant';
const TOKEN_KEY = 'booking.token';

export function getTenant(): string {
  return localStorage.getItem(TENANT_KEY) || 'acme';
}
export function setTenant(slug: string) {
  localStorage.setItem(TENANT_KEY, slug);
}
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({ baseURL: '/api' });

// Inject the active tenant (white-label resolver) and auth token on every call.
api.interceptors.request.use((config) => {
  config.headers['X-Tenant'] = getTenant();
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});
