// =====================================================================
// COMMON TYPES
// =====================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  total?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================================
// RECRUITMENT TYPES
// =====================================================================

export enum JobPostingStatus {
  Draft = 'Draft',
  Open = 'Open',
  Closed = 'Closed',
  OnHold = 'OnHold',
}

export enum ApplicationStatus {
  Received = 'Received',
  Screening = 'Screening',
  Interview = 'Interview',
  Offer = 'Offer',
  Hired = 'Hired',
  Rejected = 'Rejected',
}

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  contractType: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  description: string;
  requirements: string;
  status: JobPostingStatus;
  publishedAt?: string;
  closedAt?: string;
  applicationsCount: number;
  createdAt: string;
}

export interface Application {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  score?: number;
  source: string;
  appliedAt: string;
  cvUrl?: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cvUrl?: string;
  linkedinUrl?: string;
  skills: string[];
  experience: number;
  applications: Application[];
}

export interface PipelineStage {
  status: ApplicationStatus;
  count: number;
  applications: Application[];
}

// =====================================================================
// PAYROLL TYPES
// =====================================================================

export enum PayrollStatus {
  Draft = 'Draft',
  Calculated = 'Calculated',
  Validated = 'Validated',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
}

export interface PayrollRun {
  id: string;
  companyId: string;
  year: number;
  month: number;
  status: PayrollStatus;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalEmployerContributions: number;
  calculatedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  grossSalary: number;
  netSalary: number;
  employeeContributions: number;
  employerContributions: number;
  incomeTax: number;
  bonus: number;
  deductions: number;
  currency: string;
}

export interface Bonus {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  amount: number;
  currency: string;
  reason?: string;
  paymentDate: string;
}

// =====================================================================
// TRAINING TYPES
// =====================================================================

export enum TrainingType {
  Online = 'Online',
  InPerson = 'InPerson',
  Hybrid = 'Hybrid',
}

export enum EnrollmentStatus {
  Enrolled = 'Enrolled',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  type: TrainingType;
  duration: number;
  isOnline: boolean;
  leadsToCertification: boolean;
  languageCode: string;
  sessionCount: number;
  enrollmentCount: number;
  rating?: number;
}

export interface TrainingSession {
  id: string;
  courseId: string;
  courseTitle: string;
  startDate: string;
  endDate: string;
  location?: string;
  instructor?: string;
  maxParticipants?: number;
  enrolledCount: number;
  status: string;
}

export interface Enrollment {
  id: string;
  sessionId: string;
  courseTitle: string;
  employeeId: string;
  employeeName: string;
  status: EnrollmentStatus;
  progress: number;
  score?: number;
  completedAt?: string;
  enrolledAt: string;
}

export interface Certification {
  id: string;
  employeeId: string;
  name: string;
  issuedBy: string;
  issueDate: string;
  expiryDate?: string;
  isExpired: boolean;
  certificateUrl?: string;
}

// =====================================================================
// ATTENDANCE TYPES
// =====================================================================

export enum LeaveStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

export enum LeaveType {
  PaidLeave = 'PaidLeave',
  Sick = 'Sick',
  Unpaid = 'Unpaid',
  RTT = 'RTT',
  Parental = 'Parental',
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut?: string;
  totalHours: number;
  isRemote: boolean;
  location?: string;
  status: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: LeaveStatus;
  reason?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  type: LeaveType;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
}

export interface Overtime {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  type: string;
  rate: number;
  amount: number;
  isApproved: boolean;
  isCompensated: boolean;
}

// =====================================================================
// DASHBOARD TYPES
// =====================================================================

export interface HRDashboard {
  totalEmployees: number;
  newHiresThisMonth: number;
  departuresThisMonth: number;
  turnoverRate: number;
  averageAbsenteeism: number;
  totalPayrollCost: number;
  openPositions: number;
  pendingLeaveRequests: number;
  employeesByDepartment: Record<string, number>;
  employeesByContractType: Record<string, number>;
  employeesByCountry: Record<string, number>;
}

export interface HRKPI {
  name: string;
  value: number;
  unit: string;
  target?: number;
  previousPeriod?: number;
  variance?: number;
  trend: 'Up' | 'Down' | 'Stable';
}

// =====================================================================
// PERFORMANCE TYPES
// =====================================================================

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  type: string;
  period: string;
  year: number;
  status: string;
  overallScore?: number;
  strengths?: string;
  areasForImprovement?: string;
  scheduledDate?: string;
  completedAt?: string;
}

export interface Objective {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description?: string;
  level: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  keyResults: KeyResult[];
}

export interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
}
