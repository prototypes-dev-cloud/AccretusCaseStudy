export type ExchangeStage =
  | 'Initial Intake'
  | 'Document Review'
  | '45-Day ID Window Active'
  | '180-Day Close Active'
  | 'Completed';

export type EscrowStatus = 'Verified' | 'Pending';

export type PartnerType = 'CPA' | 'Real Estate Attorney' | 'CRE Broker';

export type UserRole = 'Partner User' | 'QI Admin';

export interface QIEntity {
  id: string;
  name: string;
  logoInitials: string;
  primaryColor: string;
  logoPath?: string;
  website: string;
  phone: string;
  email: string;
  address: string;
}

export interface Partner {
  id: string;
  organizationName: string;
  type: PartnerType;
  logoInitials: string;
  primaryColor: string;
  logoPath?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  joinedDate: string;
}

export interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  propertyType: string;
  salePrice: number;
  relinquishedDate: string;
  replacementAddress?: string;
  replacementCity?: string;
  replacementState?: string;
  replacementPropertyType?: string;
  replacementPrice?: number;
}

export interface Milestone {
  label: string;
  date: string;
  completed: boolean;
  current: boolean;
}

export interface Exchange {
  id: string;
  clientName: string;
  clientEmail: string;
  partnerId: string;
  stage: ExchangeStage;
  propertyDetails: PropertyDetails;
  closingDate: string;
  deadline45Day: string;
  deadline180Day: string;
  escrowStatus: EscrowStatus;
  escrowNotes: string;
  atRisk: boolean;
  fundsAmount: number;
  createdAt: string;
  milestones: Milestone[];
}

export interface ArtifactLog {
  id: string;
  partnerId: string;
  exchangeId: string;
  action: 'generate' | 'copy_link' | 'download_pdf';
  timestamp: string;
}

export interface AppState {
  currentUser: {
    role: UserRole;
    partnerId: string | null; // null for QI Admin
    name: string;
  };
  qi: QIEntity;
  partners: Partner[];
  exchanges: Exchange[];
  artifactLogs: ArtifactLog[];
}
