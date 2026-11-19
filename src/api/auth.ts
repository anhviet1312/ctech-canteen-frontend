import client from './client';

export const login = (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return client.post('/api/auth/login', formData);
};

export const getMe = () => client.get('/api/auth/me');
