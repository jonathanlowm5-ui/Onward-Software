import api from './api';

// Image upload (banners, promotions, game art). Returns a hosted URL.
export const uploadImage = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
