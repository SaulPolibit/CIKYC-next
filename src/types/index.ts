// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: '1' | '2' | '3'; // 1 = Agent, 2 = Operator Admin, 3 = Organization Admin
  created_at?: string;
}

export interface VerifiedUser {
  id: string;
  name: string;
  phone: string;
  user_email: string;
  agent_email: string;
  agent_name: string;
  kyc_url: string;
  kyc_id: string;
  kyc_status: KYCStatus;
  date_sent: string;
  downloaded: boolean;
  created_at?: string;
}

export type KYCStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Approved'
  | 'Declined'
  | 'In Review'
  | 'Expired'
  | 'Abandoned'
  | 'Kyc Expired';

export type KYCStatusSpanish =
  | 'Enviado'
  | 'En Progreso'
  | 'Aprobado'
  | 'Declinado'
  | 'En Revisión'
  | 'Expirado'
  | 'Abandonado'
  | 'KYC Expirado';

// Status mapping
export const statusMap: Record<KYCStatus, KYCStatusSpanish> = {
  'Not Started': 'Enviado',
  'In Progress': 'En Progreso',
  'Approved': 'Aprobado',
  'Declined': 'Declinado',
  'In Review': 'En Revisión',
  'Expired': 'Expirado',
  'Abandoned': 'Abandonado',
  'Kyc Expired': 'KYC Expirado',
};

export const statusReverseMap: Record<KYCStatusSpanish, KYCStatus[]> = {
  'Enviado': ['Not Started'],
  'En Progreso': ['In Progress'],
  'Aprobado': ['Approved'],
  'Declinado': ['Declined'],
  'En Revisión': ['In Review'],
  'Expirado': ['Expired'],
  'Abandonado': ['Abandoned'],
  'KYC Expirado': ['Kyc Expired'],
};

// Role options
export const ROLE_OPTIONS = [
  { value: '1', label: 'Agente' },
  { value: '2', label: 'Operador (Admin)' },
  { value: '3', label: 'Organización (Admin)' },
] as const;

// KYC Status options for filter
export const KYC_STATUS_OPTIONS: { value: KYCStatusSpanish; label: string }[] = [
  { value: 'Enviado', label: 'Enviado' },
  { value: 'En Progreso', label: 'En Progreso' },
  { value: 'Aprobado', label: 'Aprobado' },
  { value: 'Declinado', label: 'Declinado' },
  { value: 'En Revisión', label: 'En Revisión' },
  { value: 'Expirado', label: 'Expirado' },
  { value: 'Abandonado', label: 'Abandonado' },
  { value: 'KYC Expirado', label: 'KYC Expirado' },
];

// Auth context types
export interface AuthContextType {
  currentUser: { email: string } | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
  isOperator: boolean;
  isOrganization: boolean;
  isRegularUser: boolean;
}

// API response types
export interface TokenResponse {
  token: string;
}

export interface SessionResponse {
  url: string;
  sessionId: string;
}

// Form data types
export interface CreateVerifiedUserData {
  name: string;
  phone: string;
  user_email: string;
  agent_email: string;
  agent_name: string;
  kyc_url: string;
  kyc_id: string;
  kyc_status: KYCStatus;
  downloaded: boolean;
}
