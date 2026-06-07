import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api, getToken, setToken } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string; name: string; role: string } | null>(null);
  const token = ref<string | null>(getToken());

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    token.value = data.token;
    user.value = data.user;
    setToken(data.token);
    return data;
  }

  async function oauth(provider: string) {
    const { data } = await api.get(`/auth/oauth/${provider}`);
    token.value = data.token;
    user.value = data.user;
    setToken(data.token);
    return data;
  }

  /** Apply a session from an onboarding/signup response. */
  function applySession(newToken: string, newUser: any) {
    token.value = newToken;
    user.value = newUser;
    setToken(newToken);
  }

  function logout() {
    user.value = null;
    token.value = null;
    setToken(null);
  }

  const isAuthenticated = () => !!token.value;

  return { user, token, login, oauth, applySession, logout, isAuthenticated };
});
