import client from './client';

export const getProducts = (params?: any) => client.get('/api/products', { params });
export const createProduct = (data: any) => client.post('/api/products', data);
export const updateProduct = (id: number, data: any) => client.put(`/api/products/${id}`, data);
export const deleteProduct = (id: number) => client.delete(`/api/products/${id}`);
