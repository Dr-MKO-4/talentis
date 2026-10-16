import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse, EmployeeListItem, EmployeeDetail, PagedResult,
  EmployeeFilter, CreateEmployeeDto, UpdateEmployeeDto,
  CreateMutationDto, OrgChartNode, References, CareerHistory,
  EmployeeDocument, AlertsResponse
} from '../types/personnel';

// =============================================================================
// AXIOS INSTANCE
// =============================================================================
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // Pour les cookies refresh token
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : ajouter le JWT depuis le store
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('talentis_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur : refresh token automatique si 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('talentis_token', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('talentis_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const BASE = '/api/v1/employees';

// =============================================================================
// EMPLOYEE SERVICE
// =============================================================================
export const employeeService = {

  // ------ LISTE & FILTRES ------
  getAll: async (filter: Partial<EmployeeFilter> = {}): Promise<ApiResponse<PagedResult<EmployeeListItem>>> => {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const { data } = await api.get(`${BASE}?${params.toString()}`);
    return data;
  },

  // ------ DÉTAIL ------
  getById: async (id: string): Promise<ApiResponse<EmployeeDetail>> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data;
  },

  // ------ CRÉER ------
  create: async (dto: CreateEmployeeDto): Promise<ApiResponse<EmployeeDetail>> => {
    const { data } = await api.post(BASE, dto);
    return data;
  },

  // ------ METTRE À JOUR ------
  update: async (id: string, dto: UpdateEmployeeDto): Promise<ApiResponse<EmployeeDetail>> => {
    const { data } = await api.put(`${BASE}/${id}`, dto);
    return data;
  },

  // ------ SUPPRIMER ------
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`${BASE}/${id}`);
    return data;
  },

  // ------ ORGANIGRAMME ------
  getOrgChart: async (id: string): Promise<ApiResponse<OrgChartNode>> => {
    const { data } = await api.get(`${BASE}/${id}/orgchart`);
    return data;
  },

  getFullOrgChart: async (companyId: string): Promise<ApiResponse<OrgChartNode[]>> => {
    const { data } = await api.get(`${BASE}/orgchart?companyId=${companyId}`);
    return data;
  },

  // ------ MUTATION ------
  createMutation: async (id: string, dto: CreateMutationDto): Promise<ApiResponse<null>> => {
    const { data } = await api.post(`${BASE}/${id}/mutation`, dto);
    return data;
  },

  // ------ DOCUMENTS ------
  getDocuments: async (id: string): Promise<ApiResponse<EmployeeDocument[]>> => {
    const { data } = await api.get(`${BASE}/${id}/documents`);
    return data;
  },

  uploadDocument: async (
    id: string,
    file: File,
    documentType: string,
    description?: string,
    expiryDate?: string
  ): Promise<ApiResponse<EmployeeDocument>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) formData.append('description', description);
    if (expiryDate) formData.append('expiryDate', expiryDate);

    const { data } = await api.post(`${BASE}/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  downloadDocument: (id: string, docId: string): string =>
    `${import.meta.env.VITE_API_URL}${BASE}/${id}/documents/${docId}/download`,

  deleteDocument: async (id: string, docId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`${BASE}/${id}/documents/${docId}`);
    return data;
  },

  // ------ PHOTO ------
  uploadPhoto: async (id: string, photo: File): Promise<ApiResponse<{ photoUrl: string }>> => {
    const formData = new FormData();
    formData.append('photo', photo);
    const { data } = await api.post(`${BASE}/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // ------ HISTORIQUE DE CARRIÈRE ------
  getCareerHistory: async (id: string): Promise<ApiResponse<CareerHistory[]>> => {
    const { data } = await api.get(`${BASE}/${id}/career-history`);
    return data;
  },

  // ------ RGPD ------
  gdprExport: async (id: string): Promise<ApiResponse<unknown>> => {
    const { data } = await api.post(`${BASE}/${id}/gdpr/export`);
    return data;
  },

  gdprAnonymize: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`${BASE}/${id}/gdpr/anonymize`);
    return data;
  },

  // ------ RÉFÉRENCES ------
  getReferences: async (companyId: string): Promise<ApiResponse<References>> => {
    const { data } = await api.get(`${BASE}/references?companyId=${companyId}`);
    return data;
  },

  // ------ ALERTES ------
  getAlerts: async (daysAhead = 30): Promise<ApiResponse<AlertsResponse>> => {
    const { data } = await api.get(`${BASE}/alerts?daysAhead=${daysAhead}`);
    return data;
  },
};

export default api;
