import client from './api.client';
import type { LoginCredentials, RegisterCredentials, User } from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await client.post('/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials) => {
    const { data } = await client.post('/auth/register', credentials);
    return data;
  },

  getMe: async (): Promise<{ data: User }> => {
    const { data } = await client.get('/auth/me');
    return data;
  },

  logout: async () => {
    const { data } = await client.post('/auth/logout');
    return data;
  },
};