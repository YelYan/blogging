import client from './api.client';
import type { Story, StoryFilters, StoriesResponse, StoryStats } from '@/types';

export const storyApi = {
  // Get stories with filters
  getStories: async (filters?: StoryFilters): Promise<StoriesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const { data } = await client.get(`/stories?${params.toString()}`);
    return data;
  },

  // Get single story
  getStory: async (identifier: string): Promise<{ data: Story; relatedStories: Story[] }> => {
    const { data } = await client.get(`/stories/view/${identifier}`);
    return data;
  },

  // Create story
  createStory: async (storyData: FormData | Partial<Story>) => {
    const config = storyData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const { data } = await client.post('/stories', storyData, config);
    return data;
  },

  // Update story
  updateStory: async (id: string, storyData: FormData | Partial<Story>) => {
    const config = storyData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const { data } = await client.put(`/stories/${id}`, storyData, config);
    return data;
  },

  // Delete story
  deleteStory: async (id: string, permanent: boolean = false) => {
    const { data } = await client.delete(`/stories/${id}?permanent=${permanent}`);
    return data;
  },

  // Like story
  likeStory: async (id: string) => {
    const { data } = await client.put(`/stories/${id}/like`);
    return data;
  },

  // Dislike story
  dislikeStory: async (id: string) => {
    const { data } = await client.put(`/stories/${id}/dislike`);
    return data;
  },

  // Bookmark story
  bookmarkStory: async (id: string) => {
    const { data } = await client.put(`/stories/${id}/bookmark`);
    return data;
  },

  // Share story
  shareStory: async (id: string) => {
    const { data } = await client.put(`/stories/${id}/share`);
    return data;
  },

  // Get featured stories
  getFeaturedStories: async (limit: number = 5) => {
    const { data } = await client.get(`/stories/featured?limit=${limit}`);
    return data;
  },

  // Get trending stories
  getTrendingStories: async (days: number = 7, limit: number = 10) => {
    const { data } = await client.get(`/stories/trending?days=${days}&limit=${limit}`);
    return data;
  },

  // Get top stories
  getTopStories: async (limit: number = 10) => {
    const { data } = await client.get(`/stories/top?limit=${limit}`);
    return data;
  },

  // Get stories by category
  getStoriesByCategory: async (category: string, page: number = 1, limit: number = 10) => {
    const { data } = await client.get(`/stories/category/${category}?page=${page}&limit=${limit}`);
    return data;
  },

  // Get stories by tag
  getStoriesByTag: async (tag: string, page: number = 1, limit: number = 10) => {
    const { data } = await client.get(`/stories/tag/${tag}?page=${page}&limit=${limit}`);
    return data;
  },

  // Get user stories
  getUserStories: async (userId: string, page: number = 1, limit: number = 10, status?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    const { data } = await client.get(`/stories/user/${userId}?${params.toString()}`);
    return data;
  },

  // Get bookmarked stories
  getBookmarkedStories: async (page: number = 1, limit: number = 10) => {
    const { data } = await client.get(`/stories/bookmarks?page=${page}&limit=${limit}`);
    return data;
  },

  // Get story statistics
  getStoryStats: async (id: string): Promise<{ data: StoryStats }> => {
    const { data } = await client.get(`/stories/${id}/stats`);
    return data;
  },

  // Get categories
  getCategories: async () => {
    const { data } = await client.get('/stories/categories');
    return data;
  },

  // Get tags
  getTags: async () => {
    const { data } = await client.get('/stories/tags');
    return data;
  },

  // Search stories
  searchStories: async (query: string, searchIn: string = 'all', page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({
      q: query,
      searchIn,
      page: page.toString(),
      limit: limit.toString()
    });
    const { data } = await client.get(`/stories/search?${params.toString()}`);
    return data;
  },
};