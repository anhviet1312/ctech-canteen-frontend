import client from './client';

export const getProposals = (params?: any) => client.get('/api/proposals', { params });
export const getProposalDetail = (id: number) => client.get(`/api/proposals/${id}`);
export const aiAnalyze = () => client.post('/api/proposals/ai-analyze');
export const createProposal = (data: any) => client.post('/api/proposals', data);
export const approveProposal = (id: number, data: any) => client.put(`/api/proposals/${id}/approve`, data);
export const rejectProposal = (id: number, data: any) => client.put(`/api/proposals/${id}/reject`, data);
export const startProposal = (id: number) => client.put(`/api/proposals/${id}/start`, {});
export const completeProposal = (id: number) => client.put(`/api/proposals/${id}/complete`, {});
export const cancelProposal = (id: number, data: any) => client.put(`/api/proposals/${id}/cancel`, data);
