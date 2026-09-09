import api from './api';

export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const postService = {
  getPosts: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),

  createPost: (formData) =>
    api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deletePost: (postId) => api.delete(`/posts/${postId}`),

  toggleLike: (postId) => api.post(`/posts/${postId}/like`),

  addComment: (postId, text) => api.post(`/posts/${postId}/comments`, { text }),
};

export const userService = {
  getProfile: (username) => api.get(`/users/${username}`),
  
  uploadImages: (formData) => 
    api.put('/users/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    
  toggleFollow: (userId) => api.post(`/users/${userId}/follow`),

  searchUsers: (query) => api.get(`/users/search?q=${query}`),
};

export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (userId, text) => api.post(`/messages/${userId}`, { text }),
};
