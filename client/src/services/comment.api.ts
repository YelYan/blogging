import client from './api.client';

export const commentApi = {
  getComments: async (storyId: string) => {
    const { data } = await client.get(`/comments/story/${storyId}`);
    return data;
  },

  addComment: async (storyId: string, content: string, star?: number) => {
    const { data } = await client.post('/comments', { story: storyId, content, star });
    return data;
  },

  updateComment: async (commentId: string, content: string) => {
    const { data } = await client.put(`/comments/${commentId}`, { content });
    return data;
  },

  deleteComment: async (commentId: string) => {
    const { data } = await client.delete(`/comments/${commentId}`);
    return data;
  },

  likeComment: async (commentId: string) => {
    const { data } = await client.put(`/comments/${commentId}/like`);
    return data;
  },
};