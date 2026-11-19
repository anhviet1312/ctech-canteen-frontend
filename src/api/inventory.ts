import client from './client';

export const getInventory = (params?: any) => client.get('/api/inventory', { params });
export const getAlerts = () => client.get('/api/inventory/alerts');
export const getDashboard = () => client.get('/api/inventory/dashboard');
