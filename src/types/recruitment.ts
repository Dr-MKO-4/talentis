export type JobPostingStatus = 'Draft' | 'Published' | 'Closed' | 'Archived';
export type JobPostingType = 'Internal' | 'External' | 'Both';
export type ApplicationStatus = 
  | 'Received' | 'Shortlisted' | 'Tested' | 'Interviewed' 
  | 'SecondInterview' | 'OfferSent' | 'Hired' | 'Rejected' | 'Withdrawn';

export interface JobPostingList {
  id: string;
  title: string;
  departmentName: string;
  location: string;
  contractType: string;
  status: JobPostingStatus;
  statusLabel: string;
  postingType: JobPostingType;
  isRemote: boolean;
  publishedAt?: string;
  closingDate?: string;
  applicationCount: number;
  viewCount: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  displaySalary: boolean;
  recruiterName?: string;
  createdAt: string;
}

export interface JobPostingDetail {
  id: string;
  companyId: string;
  companyName: string;
  departmentId: string;
  departmentName: string;
  jobPositionId?: string;
  jobPositionTitle?: string;
  hiringManagerId?: string;
  hiringManagerName?: string;
  recruiterOwnerId?: string;
  recruiterOwnerName?: string;
  title: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  contractType: string;
  postingType: JobPostingType;
  status: JobPostingStatus;
  location?: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  displaySalary: boolean;
  publishedAt?: string;
  closingDate?: string;
  maxApplications?: number;
  viewCount: number;
  applicationCount: number;
  publishedOnLinkedIn: boolean;
  publishedOnIndeed: boolean;
  publishedOnMonster: boolean;
  publishedOnGlassdoor: boolean;
  publishedOnCareerSite: boolean;
  translations: JobPostingTranslation[];
  applications: JobApplicationList[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface JobPostingTranslation {
  id: string;
  languageCode: string;
  title: string;
  description?: string;
  requirements?: string;
  benefits?: string;
}

export interface CandidateList {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  linkedInUrl?: string;
  isInTalentPool: boolean;
  source?: string;
  createdAt: string;
  applicationCount: number;
}

export interface CandidateDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  cvFilePath?: string;
  cvParsedJson?: string;
  skills: string[];
  languages: string[];
  education: unknown[];
  experience: unknown[];
  isInTalentPool: boolean;
  tags: string[];
  source?: string;
  gdprConsentGiven: boolean;
  gdprConsentDate?: string;
  gdprRetentionUntil?: string;
  applications: JobApplicationList[];
  createdAt: string;
}

export interface JobApplicationList {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateCity?: string;
  status: ApplicationStatus;
  statusLabel: string;
  matchingScore?: number;
  isInternal: boolean;
  source?: string;
  assignedRecruiter?: string;
  assignedRecruiterName?: string;
  createdAt: string;
}

export interface JobApplicationDetail {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  candidate: CandidateDetail;
  status: ApplicationStatus;
  matchingScore?: number;
  coverLetter?: string;
  internalNotes?: string;
  rejectionReason?: string;
  rejectionSentAt?: string;
  source?: string;
  isInternal: boolean;
  assignedRecruiter?: string;
  assignedRecruiterName?: string;
  notes: ApplicationNote[];
  createdAt: string;
  updatedAt?: string;
}

export interface ApplicationNote {
  id: string;
  content: string;
  isPrivate: boolean;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface PipelineKanban {
  jobPostingId: string;
  jobTitle: string;
  columns: Record<ApplicationStatus, JobApplicationList[]>;
  counts: Record<ApplicationStatus, number>;
}

export interface RecruitmentAnalytics {
  totalJobPostings: number;
  activeJobPostings: number;
  totalCandidates: number;
  talentPoolSize: number;
  totalApplications: number;
  applicationsThisMonth: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  applicationsBySource: Record<string, number>;
  averageTimeToHire: number;
  averageCostPerHire: number;
  offerAcceptanceRate: number;
  topPerformingJobs: TopJobPosting[];
}

export interface TopJobPosting {
  id: string;
  title: string;
  applicationCount: number;
  viewCount: number;
  conversionRate: number;
}

export interface CreateJobPostingDto {
  companyId: string;
  departmentId: string;
  jobPositionId?: string;
  hiringManagerId?: string;
  recruiterOwnerId?: string;
  title: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  contractType: string;
  postingType: JobPostingType;
  location?: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  displaySalary: boolean;
  closingDate?: string;
  maxApplications?: number;
  publishOnLinkedIn: boolean;
  publishOnIndeed: boolean;
  publishOnMonster: boolean;
  publishOnGlassdoor: boolean;
  publishOnCareerSite: boolean;
}

export interface UpdateJobPostingDto {
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  contractType?: string;
  postingType?: JobPostingType;
  status?: JobPostingStatus;
  location?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  closingDate?: string;
  maxApplications?: number;
}

export interface CreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  source?: string;
  gdprConsentGiven: boolean;
}

export interface CreateApplicationDto {
  jobPostingId: string;
  candidateId?: string;
  newCandidate?: CreateCandidateDto;
  coverLetter?: string;
  source?: string;
  isInternal: boolean;
}

export interface UpdateApplicationDto {
  status?: ApplicationStatus;
  internalNotes?: string;
  rejectionReason?: string;
  assignedRecruiter?: string;
}

export interface JobPostingFilter {
  search?: string;
  companyId?: string;
  departmentId?: string;
  status?: JobPostingStatus;
  postingType?: JobPostingType;
  contractType?: string;
  isRemote?: boolean;
  publishedAfter?: string;
  closingBefore?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDesc: boolean;
}

export interface CandidateFilter {
  search?: string;
  isInTalentPool?: boolean;
  source?: string;
  skills?: string[];
  page: number;
  pageSize: number;
  sortBy: string;
  sortDesc: boolean;
}

export interface ApplicationFilter {
  search?: string;
  jobPostingId?: string;
  candidateId?: string;
  status?: ApplicationStatus;
  isInternal?: boolean;
  assignedRecruiter?: string;
  createdAfter?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDesc: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
