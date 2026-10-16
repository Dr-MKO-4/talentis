import axios, { AxiosInstance } from 'axios';

// Configuration API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Instance Axios configurée
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================================================
// RECRUITMENT API
// =====================================================================

export const recruitmentApi = {
  // Job Postings
  getJobPostings: (params?: any) => 
    apiClient.get('/recruitment/job-postings', { params }),
  
  getJobPosting: (id: string) => 
    apiClient.get(`/recruitment/job-postings/${id}`),
  
  createJobPosting: (data: any) => 
    apiClient.post('/recruitment/job-postings', data),
  
  updateJobPosting: (id: string, data: any) => 
    apiClient.put(`/recruitment/job-postings/${id}`, data),
  
  publishJobPosting: (id: string) => 
    apiClient.post(`/recruitment/job-postings/${id}/publish`),

  // Applications
  getApplications: (params?: any) => 
    apiClient.get('/recruitment/applications', { params }),
  
  getApplication: (id: string) => 
    apiClient.get(`/recruitment/applications/${id}`),
  
  updateApplicationStatus: (id: string, status: string) => 
    apiClient.put(`/recruitment/applications/${id}/status`, { status }),
  
  // Candidates
  getCandidates: (params?: any) => 
    apiClient.get('/recruitment/candidates', { params }),
  
  getCandidate: (id: string) => 
    apiClient.get(`/recruitment/candidates/${id}`),

  // Pipeline
  getPipeline: (jobPostingId?: string) => 
    apiClient.get('/recruitment/pipeline', { params: { jobPostingId } }),
};

// =====================================================================
// PAYROLL API
// =====================================================================

export const payrollApi = {
  // Payroll Runs
  getPayrollRuns: (params?: any) => 
    apiClient.get('/payroll/runs', { params }),
  
  getPayrollRun: (id: string) => 
    apiClient.get(`/payroll/runs/${id}`),
  
  createPayrollRun: (data: any) => 
    apiClient.post('/payroll/runs', data),
  
  calculatePayroll: (id: string) => 
    apiClient.post(`/payroll/runs/${id}/calculate`),
  
  finalizePayroll: (id: string) => 
    apiClient.post(`/payroll/runs/${id}/finalize`),

  // Payslips
  getPayslips: (params?: any) => 
    apiClient.get('/payroll/payslips', { params }),
  
  getPayslip: (id: string) => 
    apiClient.get(`/payroll/payslips/${id}`),
  
  downloadPayslip: (id: string) => 
    apiClient.get(`/payroll/payslips/${id}/download`, { responseType: 'blob' }),

  // Bonuses
  getBonuses: (params?: any) => 
    apiClient.get('/payroll/bonuses', { params }),
  
  createBonus: (data: any) => 
    apiClient.post('/payroll/bonuses', data),

  // Analytics
  getAnalytics: (params?: any) => 
    apiClient.get('/payroll/analytics', { params }),
};

// =====================================================================
// TRAINING API
// =====================================================================

export const trainingApi = {
  // Courses
  getCourses: (params?: any) => 
    apiClient.get('/training/courses', { params }),
  
  getCourse: (id: string) => 
    apiClient.get(`/training/courses/${id}`),
  
  createCourse: (data: any) => 
    apiClient.post('/training/courses', data),

  // Sessions
  getSessions: (params?: any) => 
    apiClient.get('/training/sessions', { params }),
  
  getSession: (id: string) => 
    apiClient.get(`/training/sessions/${id}`),
  
  createSession: (data: any) => 
    apiClient.post('/training/sessions', data),

  // Enrollments
  getEnrollments: (params?: any) => 
    apiClient.get('/training/enrollments', { params }),
  
  enrollInSession: (data: any) => 
    apiClient.post('/training/enrollments', data),

  // Certifications
  getCertifications: (employeeId: string) => 
    apiClient.get(`/training/certifications/${employeeId}`),
  
  getExpiringCertifications: (daysAhead?: number) => 
    apiClient.get('/training/certifications/expiring', { params: { daysAhead } }),

  // Analytics
  getAnalytics: (params?: any) => 
    apiClient.get('/training/analytics', { params }),
};

// =====================================================================
// ATTENDANCE API
// =====================================================================

export const attendanceApi = {
  // Time Tracking
  clockIn: (data: any) => 
    apiClient.post('/attendance/clock-in', data),
  
  clockOut: () => 
    apiClient.post('/attendance/clock-out'),
  
  getTimeEntries: (params?: any) => 
    apiClient.get('/attendance/time-entries', { params }),

  // Leave Requests
  getLeaveRequests: (params?: any) => 
    apiClient.get('/attendance/leave-requests', { params }),
  
  createLeaveRequest: (data: any) => 
    apiClient.post('/attendance/leave-requests', data),
  
  approveLeave: (id: string) => 
    apiClient.post(`/attendance/leave-requests/${id}/approve`),
  
  rejectLeave: (id: string, reason: string) => 
    apiClient.post(`/attendance/leave-requests/${id}/reject`, { reason }),

  // Leave Balance
  getLeaveBalance: (employeeId: string) => 
    apiClient.get(`/attendance/leave-balance/${employeeId}`),

  // Overtime
  getOvertime: (params?: any) => 
    apiClient.get('/attendance/overtime', { params }),

  // Analytics
  getAnalytics: (params?: any) => 
    apiClient.get('/attendance/analytics', { params }),
};

// =====================================================================
// DASHBOARD API
// =====================================================================

export const dashboardApi = {
  getHRDashboard: (companyId: string) => 
    apiClient.get('/reporting/dashboard', { params: { companyId } }),
  
  getKPIs: (companyId: string, startDate?: string, endDate?: string) => 
    apiClient.get('/reporting/kpis', { params: { companyId, startDate, endDate } }),
};

// =====================================================================
// PERFORMANCE API
// =====================================================================

export const performanceApi = {
  getReviews: (params?: any) => 
    apiClient.get('/performance/reviews', { params }),
  
  getObjectives: (params?: any) => 
    apiClient.get('/performance/objectives', { params }),
  
  updateObjective: (id: string, data: any) => 
    apiClient.put(`/performance/objectives/${id}`, data),
};

// =====================================================================
// COMMON UTILITIES
// =====================================================================

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Une erreur est survenue';
};
