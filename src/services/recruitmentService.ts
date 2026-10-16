import axios from 'axios';
import {
  ApiResponse, PagedResult, JobPostingList, JobPostingDetail,
  JobPostingFilter, CreateJobPostingDto, UpdateJobPostingDto,
  CandidateList, CandidateDetail, CandidateFilter, CreateCandidateDto,
  JobApplicationList, JobApplicationDetail, ApplicationFilter,
  CreateApplicationDto, UpdateApplicationDto, PipelineKanban,
  RecruitmentAnalytics, ApplicationNote
} from '../types/recruitment';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('talentis_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const BASE = '/api/v1/recruitment';

export const recruitmentService = {
  // ===== JOB POSTINGS =====
  getJobs: async (filter: Partial<JobPostingFilter> = {}): Promise<ApiResponse<PagedResult<JobPostingList>>> => {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const { data } = await api.get(`${BASE}/jobs?${params.toString()}`);
    return data;
  },

  getJobById: async (id: string): Promise<ApiResponse<JobPostingDetail>> => {
    const { data } = await api.get(`${BASE}/jobs/${id}`);
    return data;
  },

  createJob: async (dto: CreateJobPostingDto): Promise<ApiResponse<JobPostingDetail>> => {
    const { data } = await api.post(`${BASE}/jobs`, dto);
    return data;
  },

  updateJob: async (id: string, dto: UpdateJobPostingDto): Promise<ApiResponse<JobPostingDetail>> => {
    const { data } = await api.put(`${BASE}/jobs/${id}`, dto);
    return data;
  },

  publishJob: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.post(`${BASE}/jobs/${id}/publish`);
    return data;
  },

  closeJob: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.post(`${BASE}/jobs/${id}/close`);
    return data;
  },

  deleteJob: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`${BASE}/jobs/${id}`);
    return data;
  },

  // ===== CANDIDATES =====
  getCandidates: async (filter: Partial<CandidateFilter> = {}): Promise<ApiResponse<PagedResult<CandidateList>>> => {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const { data } = await api.get(`${BASE}/candidates?${params.toString()}`);
    return data;
  },

  getCandidateById: async (id: string): Promise<ApiResponse<CandidateDetail>> => {
    const { data } = await api.get(`${BASE}/candidates/${id}`);
    return data;
  },

  createCandidate: async (dto: CreateCandidateDto): Promise<ApiResponse<CandidateDetail>> => {
    const { data } = await api.post(`${BASE}/candidates`, dto);
    return data;
  },

  uploadCv: async (candidateId: string, cv: File): Promise<ApiResponse<{ cvPath: string }>> => {
    const formData = new FormData();
    formData.append('cv', cv);
    const { data } = await api.post(`${BASE}/candidates/${candidateId}/upload-cv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  addToTalentPool: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.post(`${BASE}/candidates/${id}/talent-pool`);
    return data;
  },

  removeFromTalentPool: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`${BASE}/candidates/${id}/talent-pool`);
    return data;
  },

  deleteCandidate: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`${BASE}/candidates/${id}`);
    return data;
  },

  // ===== APPLICATIONS =====
  getApplications: async (filter: Partial<ApplicationFilter> = {}): Promise<ApiResponse<PagedResult<JobApplicationList>>> => {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const { data } = await api.get(`${BASE}/applications?${params.toString()}`);
    return data;
  },

  getApplicationById: async (id: string): Promise<ApiResponse<JobApplicationDetail>> => {
    const { data } = await api.get(`${BASE}/applications/${id}`);
    return data;
  },

  createApplication: async (dto: CreateApplicationDto): Promise<ApiResponse<JobApplicationDetail>> => {
    const { data } = await api.post(`${BASE}/applications`, dto);
    return data;
  },

  updateApplication: async (id: string, dto: UpdateApplicationDto): Promise<ApiResponse<JobApplicationDetail>> => {
    const { data } = await api.put(`${BASE}/applications/${id}`, dto);
    return data;
  },

  deleteApplication: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`${BASE}/applications/${id}`);
    return data;
  },

  // ===== PIPELINE KANBAN =====
  getPipeline: async (jobId: string): Promise<ApiResponse<PipelineKanban>> => {
    const { data } = await api.get(`${BASE}/jobs/${jobId}/pipeline`);
    return data;
  },

  // ===== NOTES =====
  addNote: async (applicationId: string, content: string, isPrivate: boolean): Promise<ApiResponse<ApplicationNote>> => {
    const { data } = await api.post(`${BASE}/applications/${applicationId}/notes`, { content, isPrivate });
    return data;
  },

  // ===== ANALYTICS =====
  getAnalytics: async (companyId: string, startDate?: string, endDate?: string): Promise<ApiResponse<RecruitmentAnalytics>> => {
    const params = new URLSearchParams({ companyId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const { data } = await api.get(`${BASE}/analytics?${params.toString()}`);
    return data;
  },
};

export default recruitmentService;
