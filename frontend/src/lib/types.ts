export type Role = 'student' | 'company' | 'school';

export interface User {
  _id: string;
  id?: string;
  role: Role;
  email: string;
  name: string;
  phone?: string;
  school?: string;
  schoolName?: string;
  fieldOfStudy?: string;
  educationLevel?: string;
  skills?: string[];
  languages?: { name: string; level: string }[];
  bio?: string;
  cvPath?: string;
  cvData?: any;
  sector?: string;
  website?: string;
  address?: string;
  description?: string;
}

export interface Weights {
  skills: number;
  education: number;
  experience: number;
  languages: number;
}

export interface Offer {
  _id: string;
  title: string;
  description: string;
  type: string;
  location?: string;
  duration?: string;
  startDate?: string;
  deadline?: string;
  remote?: boolean;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  requiredEducation: string;
  fieldKeywords: string[];
  minExperienceItems: number;
  requiredLanguages: { name: string; level: string }[];
  weights: Weights;
  minScore: number;
  status: 'open' | 'closed';
  company?: { _id: string; name: string; sector?: string; website?: string; address?: string; description?: string };
  applicationsCount?: number;
}

export interface Analysis {
  total: number;
  breakdown: Weights;
  matchedSkills: string[];
  missingSkills: string[];
  meetsMinimum: boolean;
}

export type AppStatus = 'submitted' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected';

export interface Application {
  _id: string;
  offer: any;
  student: any;
  coverLetter?: string;
  cvPath?: string;
  status: AppStatus;
  analysis?: Analysis;
  companyNote?: string;
  createdAt: string;
}

export interface Convention {
  _id: string;
  application: string;
  offer: any;
  student: any;
  company: any;
  school?: any;
  startDate?: string;
  endDate?: string;
  missions?: string;
  tutorCompany?: { name?: string; email?: string; phone?: string };
  tutorSchool?: { name?: string; email?: string };
  signatures: { student: boolean; company: boolean; school: boolean };
  status: 'draft' | 'pending_signatures' | 'validated' | 'rejected';
  documents: { _id: string; name: string; path: string; uploadedAt: string }[];
}

export interface Step {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'todo' | 'in_progress' | 'done';
}

export interface Evaluation {
  _id: string;
  author?: { name: string };
  authorRole: string;
  technical: number;
  autonomy: number;
  communication: number;
  punctuality: number;
  comment?: string;
  createdAt: string;
}

export interface Internship {
  _id: string;
  student: any;
  company: any;
  school?: any;
  offer?: any;
  status: 'planned' | 'ongoing' | 'completed';
  steps: Step[];
  evaluations: Evaluation[];
  progress: number;
}

export const STATUS_LABELS: Record<AppStatus, string> = {
  submitted: 'Envoyée',
  reviewing: "En cours d'examen",
  shortlisted: 'Présélectionné',
  accepted: 'Acceptée',
  rejected: 'Refusée',
};

export const STATUS_COLORS: Record<AppStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  reviewing: 'bg-amber-100 text-amber-800',
  shortlisted: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const EDU_LEVELS = ['bac', 'bac+2', 'bac+3', 'bac+5', 'doctorat'];
export const LANG_LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2', 'natif'];
export const OFFER_TYPES = ['PFE', 'Stage été', 'Stage initiation', 'Stage perfectionnement'];
