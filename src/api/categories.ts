import client from './client';

export const getCategories = () => client.get('/api/categories');
export const createCategory = (data: any) => client.post('/api/categories', data);
export const updateCategory = (id: number, data: any) => client.put(`/api/categories/${id}`, data);
export const deleteCategory = (id: number) => client.delete(`/api/categories/${id}`);
