import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import recruitmentService from '../../services/recruitmentService';
import {
  JobPostingList, JobPostingDetail, JobPostingFilter,
  CandidateList, CandidateDetail, CandidateFilter,
  JobApplicationList, JobApplicationDetail, ApplicationFilter,
  PipelineKanban, RecruitmentAnalytics, PagedResult,
  CreateJobPostingDto, UpdateJobPostingDto,
  CreateCandidateDto, CreateApplicationDto, UpdateApplicationDto
} from '../../types/recruitment';
import toast from 'react-hot-toast';

interface RecruitmentState {
  // Jobs
  jobs: JobPostingList[];
  jobsPagedResult: PagedResult<JobPostingList> | null;
  jobFilter: JobPostingFilter;
  selectedJob: JobPostingDetail | null;
  isLoadingJobs: boolean;
  isLoadingJobDetail: boolean;

  // Candidates
  candidates: CandidateList[];
  candidatesPagedResult: PagedResult<CandidateList> | null;
  candidateFilter: CandidateFilter;
  selectedCandidate: CandidateDetail | null;
  isLoadingCandidates: boolean;
  isLoadingCandidateDetail: boolean;

  // Applications
  applications: JobApplicationList[];
  applicationsPagedResult: PagedResult<JobApplicationList> | null;
  applicationFilter: ApplicationFilter;
  selectedApplication: JobApplicationDetail | null;
  isLoadingApplications: boolean;
  isLoadingApplicationDetail: boolean;

  // Pipeline
  pipeline: PipelineKanban | null;
  isLoadingPipeline: boolean;

  // Analytics
  analytics: RecruitmentAnalytics | null;
  isLoadingAnalytics: boolean;

  // CRUD states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUploading: boolean;

  // Actions - Jobs
  setJobFilter: (filter: Partial<JobPostingFilter>) => void;
  fetchJobs: () => Promise<void>;
  fetchJob: (id: string) => Promise<void>;
  createJob: (dto: CreateJobPostingDto) => Promise<JobPostingDetail | null>;
  updateJob: (id: string, dto: UpdateJobPostingDto) => Promise<boolean>;
  publishJob: (id: string) => Promise<boolean>;
  closeJob: (id: string) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;

  // Actions - Candidates
  setCandidateFilter: (filter: Partial<CandidateFilter>) => void;
  fetchCandidates: () => Promise<void>;
  fetchCandidate: (id: string) => Promise<void>;
  createCandidate: (dto: CreateCandidateDto) => Promise<CandidateDetail | null>;
  uploadCv: (candidateId: string, cv: File) => Promise<boolean>;
  addToTalentPool: (id: string) => Promise<boolean>;
  removeFromTalentPool: (id: string) => Promise<boolean>;
  deleteCandidate: (id: string) => Promise<boolean>;

  // Actions - Applications
  setApplicationFilter: (filter: Partial<ApplicationFilter>) => void;
  fetchApplications: () => Promise<void>;
  fetchApplication: (id: string) => Promise<void>;
  createApplication: (dto: CreateApplicationDto) => Promise<JobApplicationDetail | null>;
  updateApplication: (id: string, dto: UpdateApplicationDto) => Promise<boolean>;
  deleteApplication: (id: string) => Promise<boolean>;
  addNote: (appId: string, content: string, isPrivate: boolean) => Promise<boolean>;

  // Actions - Pipeline
  fetchPipeline: (jobId: string) => Promise<void>;

  // Actions - Analytics
  fetchAnalytics: (companyId: string, startDate?: string, endDate?: string) => Promise<void>;

  clearSelected: () => void;
}

const DEFAULT_JOB_FILTER: JobPostingFilter = {
  page: 1,
  pageSize: 20,
  sortBy: 'CreatedAt',
  sortDesc: true,
};

const DEFAULT_CANDIDATE_FILTER: CandidateFilter = {
  page: 1,
  pageSize: 20,
  sortBy: 'CreatedAt',
  sortDesc: true,
};

const DEFAULT_APPLICATION_FILTER: ApplicationFilter = {
  page: 1,
  pageSize: 100,
  sortBy: 'CreatedAt',
  sortDesc: true,
};

export const useRecruitmentStore = create<RecruitmentState>()(
  devtools(
    (set, get) => ({
      jobs: [],
      jobsPagedResult: null,
      jobFilter: DEFAULT_JOB_FILTER,
      selectedJob: null,
      isLoadingJobs: false,
      isLoadingJobDetail: false,

      candidates: [],
      candidatesPagedResult: null,
      candidateFilter: DEFAULT_CANDIDATE_FILTER,
      selectedCandidate: null,
      isLoadingCandidates: false,
      isLoadingCandidateDetail: false,

      applications: [],
      applicationsPagedResult: null,
      applicationFilter: DEFAULT_APPLICATION_FILTER,
      selectedApplication: null,
      isLoadingApplications: false,
      isLoadingApplicationDetail: false,

      pipeline: null,
      isLoadingPipeline: false,

      analytics: null,
      isLoadingAnalytics: false,

      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isUploading: false,

      // ================================================================
      // JOBS
      // ================================================================
      setJobFilter: (f) => set((s) => ({ jobFilter: { ...s.jobFilter, ...f, page: f.page ?? 1 } })),

      fetchJobs: async () => {
        set({ isLoadingJobs: true });
        try {
          const response = await recruitmentService.getJobs(get().jobFilter);
          if (response.success && response.data) {
            set({ jobs: response.data.items, jobsPagedResult: response.data });
          }
        } catch {
          toast.error('Erreur chargement des offres.');
        } finally {
          set({ isLoadingJobs: false });
        }
      },

      fetchJob: async (id) => {
        set({ isLoadingJobDetail: true });
        try {
          const response = await recruitmentService.getJobById(id);
          if (response.success && response.data) set({ selectedJob: response.data });
        } catch {
          toast.error('Offre introuvable.');
        } finally {
          set({ isLoadingJobDetail: false });
        }
      },

      createJob: async (dto) => {
        set({ isCreating: true });
        try {
          const response = await recruitmentService.createJob(dto);
          if (response.success && response.data) {
            toast.success('Offre créée !');
            await get().fetchJobs();
            return response.data;
          }
          toast.error(response.message || 'Erreur création.');
          return null;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erreur création.');
          return null;
        } finally {
          set({ isCreating: false });
        }
      },

      updateJob: async (id, dto) => {
        set({ isUpdating: true });
        try {
          const response = await recruitmentService.updateJob(id, dto);
          if (response.success && response.data) {
            set({ selectedJob: response.data });
            toast.success('Offre mise à jour.');
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur mise à jour.');
          return false;
        } finally {
          set({ isUpdating: false });
        }
      },

      publishJob: async (id) => {
        try {
          const response = await recruitmentService.publishJob(id);
          if (response.success) {
            toast.success('Offre publiée !');
            await get().fetchJob(id);
            await get().fetchJobs();
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur publication.');
          return false;
        }
      },

      closeJob: async (id) => {
        try {
          const response = await recruitmentService.closeJob(id);
          if (response.success) {
            toast.success('Offre fermée.');
            await get().fetchJob(id);
            await get().fetchJobs();
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur fermeture.');
          return false;
        }
      },

      deleteJob: async (id) => {
        set({ isDeleting: true });
        try {
          const response = await recruitmentService.deleteJob(id);
          if (response.success) {
            toast.success('Offre archivée.');
            set((s) => ({ jobs: s.jobs.filter(j => j.id !== id) }));
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur suppression.');
          return false;
        } finally {
          set({ isDeleting: false });
        }
      },

      // ================================================================
      // CANDIDATES
      // ================================================================
      setCandidateFilter: (f) => set((s) => ({ candidateFilter: { ...s.candidateFilter, ...f, page: f.page ?? 1 } })),

      fetchCandidates: async () => {
        set({ isLoadingCandidates: true });
        try {
          const response = await recruitmentService.getCandidates(get().candidateFilter);
          if (response.success && response.data) {
            set({ candidates: response.data.items, candidatesPagedResult: response.data });
          }
        } catch {
          toast.error('Erreur chargement candidats.');
        } finally {
          set({ isLoadingCandidates: false });
        }
      },

      fetchCandidate: async (id) => {
        set({ isLoadingCandidateDetail: true });
        try {
          const response = await recruitmentService.getCandidateById(id);
          if (response.success && response.data) set({ selectedCandidate: response.data });
        } catch {
          toast.error('Candidat introuvable.');
        } finally {
          set({ isLoadingCandidateDetail: false });
        }
      },

      createCandidate: async (dto) => {
        set({ isCreating: true });
        try {
          const response = await recruitmentService.createCandidate(dto);
          if (response.success && response.data) {
            toast.success('Candidat créé !');
            await get().fetchCandidates();
            return response.data;
          }
          toast.error(response.message || 'Erreur création.');
          return null;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erreur création.');
          return null;
        } finally {
          set({ isCreating: false });
        }
      },

      uploadCv: async (candidateId, cv) => {
        set({ isUploading: true });
        try {
          const response = await recruitmentService.uploadCv(candidateId, cv);
          if (response.success) {
            toast.success('CV uploadé.');
            await get().fetchCandidate(candidateId);
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur upload CV.');
          return false;
        } finally {
          set({ isUploading: false });
        }
      },

      addToTalentPool: async (id) => {
        try {
          const response = await recruitmentService.addToTalentPool(id);
          if (response.success) {
            toast.success('Ajouté à la CVthèque.');
            await get().fetchCandidate(id);
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur CVthèque.');
          return false;
        }
      },

      removeFromTalentPool: async (id) => {
        try {
          const response = await recruitmentService.removeFromTalentPool(id);
          if (response.success) {
            toast.success('Retiré de la CVthèque.');
            await get().fetchCandidate(id);
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur CVthèque.');
          return false;
        }
      },

      deleteCandidate: async (id) => {
        set({ isDeleting: true });
        try {
          const response = await recruitmentService.deleteCandidate(id);
          if (response.success) {
            toast.success('Candidat anonymisé (RGPD).');
            set((s) => ({ candidates: s.candidates.filter(c => c.id !== id) }));
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur suppression.');
          return false;
        } finally {
          set({ isDeleting: false });
        }
      },

      // ================================================================
      // APPLICATIONS
      // ================================================================
      setApplicationFilter: (f) => set((s) => ({ applicationFilter: { ...s.applicationFilter, ...f, page: f.page ?? 1 } })),

      fetchApplications: async () => {
        set({ isLoadingApplications: true });
        try {
          const response = await recruitmentService.getApplications(get().applicationFilter);
          if (response.success && response.data) {
            set({ applications: response.data.items, applicationsPagedResult: response.data });
          }
        } catch {
          toast.error('Erreur chargement candidatures.');
        } finally {
          set({ isLoadingApplications: false });
        }
      },

      fetchApplication: async (id) => {
        set({ isLoadingApplicationDetail: true });
        try {
          const response = await recruitmentService.getApplicationById(id);
          if (response.success && response.data) set({ selectedApplication: response.data });
        } catch {
          toast.error('Candidature introuvable.');
        } finally {
          set({ isLoadingApplicationDetail: false });
        }
      },

      createApplication: async (dto) => {
        set({ isCreating: true });
        try {
          const response = await recruitmentService.createApplication(dto);
          if (response.success && response.data) {
            toast.success('Candidature envoyée !');
            return response.data;
          }
          toast.error(response.message || 'Erreur envoi.');
          return null;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erreur envoi.');
          return null;
        } finally {
          set({ isCreating: false });
        }
      },

      updateApplication: async (id, dto) => {
        set({ isUpdating: true });
        try {
          const response = await recruitmentService.updateApplication(id, dto);
          if (response.success && response.data) {
            set({ selectedApplication: response.data });
            toast.success('Candidature mise à jour.');
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur mise à jour.');
          return false;
        } finally {
          set({ isUpdating: false });
        }
      },

      deleteApplication: async (id) => {
        set({ isDeleting: true });
        try {
          const response = await recruitmentService.deleteApplication(id);
          if (response.success) {
            toast.success('Candidature supprimée.');
            set((s) => ({ applications: s.applications.filter(a => a.id !== id) }));
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur suppression.');
          return false;
        } finally {
          set({ isDeleting: false });
        }
      },

      addNote: async (appId, content, isPrivate) => {
        try {
          const response = await recruitmentService.addNote(appId, content, isPrivate);
          if (response.success) {
            toast.success('Note ajoutée.');
            await get().fetchApplication(appId);
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur ajout note.');
          return false;
        }
      },

      // ================================================================
      // PIPELINE
      // ================================================================
      fetchPipeline: async (jobId) => {
        set({ isLoadingPipeline: true });
        try {
          const response = await recruitmentService.getPipeline(jobId);
          if (response.success && response.data) set({ pipeline: response.data });
        } catch {
          toast.error('Erreur chargement pipeline.');
        } finally {
          set({ isLoadingPipeline: false });
        }
      },

      // ================================================================
      // ANALYTICS
      // ================================================================
      fetchAnalytics: async (companyId, startDate, endDate) => {
        set({ isLoadingAnalytics: true });
        try {
          const response = await recruitmentService.getAnalytics(companyId, startDate, endDate);
          if (response.success && response.data) set({ analytics: response.data });
        } finally {
          set({ isLoadingAnalytics: false });
        }
      },

      clearSelected: () => set({
        selectedJob: null,
        selectedCandidate: null,
        selectedApplication: null,
        pipeline: null
      }),
    }),
    { name: 'recruitment-store' }
  )
);
