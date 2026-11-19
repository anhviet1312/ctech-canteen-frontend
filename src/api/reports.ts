import client from './client';

export const getImportReport = (params?: any) => client.get('/api/reports/imports', { params });
export const getExportReport = (params?: any) => client.get('/api/reports/exports', { params });
export const getInventorySummary = () => client.get('/api/reports/inventory-summary');
