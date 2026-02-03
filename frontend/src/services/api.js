import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Videos API
export const videosAPI = {
  getTypes: () => api.get('/videos/types'),
  getAll: (params) => api.get('/videos', { params }),
  getOne: (id) => api.get(`/videos/${id}`),
  upload: (formData, onProgress) =>
    api.post('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    }),
  uploadThumbnail: (videoId, formData) =>
    api.post(`/videos/${videoId}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  like: (id) => api.post(`/videos/${id}/like`),
  addComment: (id, content) => api.post(`/videos/${id}/comments`, { content }),
  getComments: (id) => api.get(`/videos/${id}/comments`),
  update: (id, data) => api.put(`/videos/${id}`, data),
  delete: (id) => api.delete(`/videos/${id}`),
  getStreamUrl: (id) => `${API_BASE_URL}/videos/${id}/stream`
};

// Users API
export const usersAPI = {
  getOne: (id) => api.get(`/users/${id}`),
  getVideos: (id, params) => api.get(`/users/${id}/videos`, { params }),
  updateProfile: (data) => api.put('/users/profile', data),
  getMatches: () => api.get('/users/matches/me')
};

// Advocacy topic labels
export const ADVOCACY_LABELS = {
  'climate': 'Climate & Environment',
  'education': 'Education Reform',
  'civil-rights': 'Civil Rights & Equality',
  'mental-health': 'Mental Health',
  'gun-violence': 'Gun Violence Prevention',
  'immigration': 'Immigration',
  'healthcare': 'Healthcare Access',
  'poverty': 'Poverty & Homelessness',
  'democracy': 'Democracy & Voting',
  'youth-empowerment': 'Youth Empowerment',
  'lgbtq': 'LGBTQ+ Rights',
  'racial-justice': 'Racial Justice',
  'womens-rights': "Women's Rights",
  'technology': 'Technology & Privacy',
  'criminal-justice': 'Criminal Justice Reform',
  'other': 'Other'
};

// Event type display names
export const EVENT_LABELS = {
  ld: 'Lincoln-Douglas',
  pf: 'Public Forum',
  policy: 'Policy',
  congress: 'Congress',
  bigquestions: 'Big Questions',
  extemp: 'Extemp',
  oratory: 'Original Oratory',
  oi: 'Oral Interp',
  di: 'Dramatic Interp',
  hi: 'Humorous Interp',
  duo: 'Duo Interp',
  poe: 'Poetry',
  informative: 'Informative',
  persuasive: 'Persuasive',
  impromptu: 'Impromptu',
  after_dinner: 'After Dinner',
  lecture: 'Lecture',
  drill: 'Drill',
  other: 'Other'
};

export const ROUND_LABELS = {
  practice: 'Practice',
  prelim: 'Prelim',
  double_octos: 'Double Octos',
  octos: 'Octofinals',
  quarters: 'Quarterfinals',
  semis: 'Semifinals',
  finals: 'Finals',
  exhibition: 'Exhibition',
  lecture: 'Lecture'
};

export const EVENT_CATEGORIES = {
  debate: ['ld', 'pf', 'policy', 'congress', 'bigquestions'],
  speech: ['oratory', 'informative', 'persuasive', 'extemp', 'impromptu', 'after_dinner'],
  interp: ['oi', 'di', 'hi', 'duo', 'poe'],
  other: ['lecture', 'drill', 'other']
};

export default api;
