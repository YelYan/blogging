import client from './api.client';
import type { User } from '@/types';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const userApi = {
  // Profile
  getMyProfile: async (): Promise<ApiResponse<User>> => {
    const { data } = await client.get('/users/profile/me');
    return data;
  },

  getPublicProfile: async (userId: string): Promise<ApiResponse<User>> => {
    const { data } = await client.get(`/users/${userId}`);
    return data;
  },

  updateProfile: async (profileData: FormData | any): Promise<ApiResponse<User>> => {
    const config = profileData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const { data } = await client.put('/users/profile/edit', profileData, config);
    return data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse> => {
    const { data } = await client.put('/users/profile/change-password', {
      oldPassword,
      newPassword,
    });
    return data;
  },

  // Follow System
  followUser: async (userId: string): Promise<ApiResponse> => {
    const { data } = await client.put(`/users/${userId}/follow`);
    return data;
  },

  unfollowUser: async (userId: string): Promise<ApiResponse> => {
    const { data } = await client.put(`/users/${userId}/unfollow`);
    return data;
  },

  getFollowers: async (userId: string, page = 1, limit = 20): Promise<ApiResponse<User[]>> => {
    const { data } = await client.get(`/users/${userId}/followers?page=${page}&limit=${limit}`);
    return data;
  },

  getFollowing: async (userId: string, page = 1, limit = 20): Promise<ApiResponse<User[]>> => {
    const { data } = await client.get(`/users/${userId}/following?page=${page}&limit=${limit}`);
    return data;
  },

  // Bookmarks
  toggleBookmark: async (storyId: string): Promise<ApiResponse> => {
    const { data } = await client.put(`/users/bookmarks/${storyId}`);
    return data;
  },

  getBookmarks: async (page = 1, limit = 10): Promise<ApiResponse> => {
    const { data } = await client.get(`/users/bookmarks/list?page=${page}&limit=${limit}`);
    return data;
  },

  // Read List
  toggleReadList: async (slug: string): Promise<ApiResponse> => {
    const { data } = await client.put(`/users/readlist/${slug}`);
    return data;
  },

  getReadList: async (page = 1, limit = 10): Promise<ApiResponse> => {
    const { data } = await client.get(`/users/readlist/all?page=${page}&limit=${limit}`);
    return data;
  },

  // Discovery
  getTopAuthors: async (limit = 10): Promise<ApiResponse<User[]>> => {
    const { data } = await client.get(`/users/top-authors?limit=${limit}`);
    return data;
  },

  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    const { data } = await client.get(`/users/search?q=${query}`);
    return data;
  },

  // Stats
  updateUserStats: async (): Promise<ApiResponse> => {
    const { data } = await client.put('/users/profile/update-stats');
    return data;
  },
};