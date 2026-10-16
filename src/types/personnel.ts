// =============================================================================
// TYPES - Module Personnel TALENTIS
// =============================================================================

export type EmployeeStatus = 'Active' | 'OnLeave' | 'Suspended' | 'TrialPeriod' | 'Resigned' | 'Terminated' | 'Retired';
export type ContractType = 'CDI' | 'CDD' | 'Freelance' | 'Internship' | 'Apprenticeship' | 'PartTime' | 'Interim';
export type Gender = 'Male' | 'Female' | 'NonBinary' | 'PreferNotToSay';
export type WorkMode = 'OnSite' | 'Remote' | 'Hybrid';
export type PayrollFrequency = 'Monthly' | 'BiWeekly' | 'Weekly';
export type DocumentType = 'Contract' | 'CV' | 'Diploma' | 'IDCard' | 'Passport' | 'WorkPermit' | 'PaySlip' | 'DisciplinaryLetter' | 'PromotionLetter' | 'Other';
export type MutationReason = 'Promotion' | 'DepartmentChange' | 'SiteChange' | 'CountryChange' | 'Reorganization' | 'Employee_Request';
export type UserRole = 'SuperAdmin' | 'HRManager' | 'HROfficer' | 'Manager' | 'Employee' | 'DirectionBoard' | 'Recruiter';

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  professionalEmail: string;
  photoUrl?: string;
  jobTitle: string;
  departmentName: string;
  siteName: string;
  countryCode: string;
  status: EmployeeStatus;
  statusLabel: string;
  contractType: ContractType;
  contractTypeLabel: string;
  hireDate: string;
  seniority: number;
  managerFullName?: string;
  workMode: WorkMode;
  hasActiveUser: boolean;
}

export interface EmployeeDetail {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  dateOfBirth: string;
  nationality?: string;
  nationalId?: string;
  photoUrl?: string;
  bio?: string;
  linkedInUrl?: string;
  personalEmail: string;
  professionalEmail: string;
  personalPhone?: string;
  professionalPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  status: EmployeeStatus;
  contractType: ContractType;
  hireDate: string;
  trialPeriodEndDate?: string;
  contractEndDate?: string;
  weeklyHours: number;
  workMode: WorkMode;
  remoteDaysPerWeek?: number;
  seniority: number;
  baseSalary: number;
  currency: string;
  payrollFrequency: PayrollFrequency;
  companyId: string;
  companyName: string;
  siteId: string;
  siteName: string;
  departmentId: string;
  departmentName: string;
  jobPositionId: string;
  jobTitle: string;
  managerId?: string;
  managerFullName?: string;
  managerPhotoUrl?: string;
  countryId: string;
  countryCode: string;
  countryName: string;
  preferredLanguage: string;
  gdprConsentGiven: boolean;
  gdprConsentDate?: string;
  documents: EmployeeDocument[];
  careerHistory: CareerHistory[];
  subordinates: EmployeeListItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeDocument {
  id: string;
  documentType: DocumentType;
  fileName: string;
  description?: string;
  fileSizeBytes: number;
  contentType: string;
  expiryDate?: string;
  isSignedElectronically: boolean;
  signedAt?: string;
  version: number;
  createdAt: string;
  uploadedBy: string;
}

export interface CareerHistory {
  id: string;
  changeType: string;
  previousValue?: string;
  newValue?: string;
  effectiveDate: string;
  comments?: string;
  jobTitle?: string;
  departmentName?: string;
  siteName?: string;
  createdAt: string;
}

export interface OrgChartNode {
  id: string;
  fullName: string;
  jobTitle: string;
  departmentName: string;
  photoUrl?: string;
  status: EmployeeStatus;
  managerId?: string;
  children: OrgChartNode[];
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  parentDepartmentId?: string;
  parentDepartmentName?: string;
  employeeCount: number;
}

export interface Site {
  id: string;
  name: string;
  city?: string;
  countryCode: string;
  isHeadquarters: boolean;
}

export interface JobPosition {
  id: string;
  title: string;
  code?: string;
  departmentId: string;
  departmentName: string;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  currency: string;
  timeZone: string;
  phonePrefix: string;
}

export interface References {
  departments: Department[];
  sites: Site[];
  jobPositions: JobPosition[];
  countries: Country[];
}

export interface EmployeeFilter {
  search?: string;
  companyId?: string;
  departmentId?: string;
  siteId?: string;
  countryId?: string;
  managerId?: string;
  status?: EmployeeStatus;
  contractType?: ContractType;
  workMode?: WorkMode;
  hireDateFrom?: string;
  hireDateTo?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDesc: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  dateOfBirth: string;
  nationality?: string;
  nationalId?: string;
  personalEmail: string;
  professionalEmail: string;
  personalPhone?: string;
  professionalPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  companyId: string;
  siteId: string;
  departmentId: string;
  jobPositionId: string;
  managerId?: string;
  countryId: string;
  contractType: ContractType;
  hireDate: string;
  trialPeriodEndDate?: string;
  contractEndDate?: string;
  weeklyHours: number;
  workMode: WorkMode;
  remoteDaysPerWeek?: number;
  baseSalary: number;
  currency: string;
  payrollFrequency: PayrollFrequency;
  preferredLanguage: string;
  createUserAccount: boolean;
  userRole?: UserRole;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  nationality?: string;
  personalPhone?: string;
  professionalPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  siteId?: string;
  departmentId?: string;
  jobPositionId?: string;
  managerId?: string;
  status?: EmployeeStatus;
  contractType?: ContractType;
  trialPeriodEndDate?: string;
  contractEndDate?: string;
  weeklyHours?: number;
  workMode?: WorkMode;
  remoteDaysPerWeek?: number;
  baseSalary?: number;
  currency?: string;
  preferredLanguage?: string;
  bio?: string;
  linkedInUrl?: string;
}

export interface CreateMutationDto {
  employeeId: string;
  toDepartmentId?: string;
  toSiteId?: string;
  toCountryId?: string;
  reason: MutationReason;
  effectiveDate: string;
  comments?: string;
}

export interface AlertsResponse {
  expiringContracts: Array<{
    id: string;
    employeeNumber: string;
    fullName: string;
    contractEndDate: string;
    daysLeft: number;
    contractType: string;
  }>;
  expiringTrialPeriods: Array<{
    id: string;
    employeeNumber: string;
    fullName: string;
    trialPeriodEndDate: string;
    daysLeft: number;
    managerName?: string;
  }>;
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
