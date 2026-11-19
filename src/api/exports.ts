import client from './client';

export const getExports = (params?: any) => client.get('/api/exports', { params });
export const getExportDetail = (id: number) => client.get(`/api/exports/${id}`);
export const createExport = (data: any) => client.post('/api/exports', data);
