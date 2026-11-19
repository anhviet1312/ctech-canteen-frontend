import client from './client';

export const getImports = (params?: any) => client.get('/api/imports', { params });
export const getImportDetail = (id: number) => client.get(`/api/imports/${id}`);
export const createImport = (data: any) => client.post('/api/imports', data);
