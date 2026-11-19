import client from './client';

export const getSuppliers = () => client.get('/api/suppliers');
export const createSupplier = (data: any) => client.post('/api/suppliers', data);
export const updateSupplier = (id: number, data: any) => client.put(`/api/suppliers/${id}`, data);
export const deleteSupplier = (id: number) => client.delete(`/api/suppliers/${id}`);
