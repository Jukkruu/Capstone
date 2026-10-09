export type UserRole = 'ADMIN' | 'EDITOR' | 'GCP' | 'USER' | 'SUPPLIER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  type: 'bigc' | 'supplier';
  accessToken: string;
  mustChangePassword?: boolean;
}

export type SubmissionStatus =
  | 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW'
  | 'APPROVED' | 'REJECTED' | 'NOMINATED' | 'EXPORTED';

export type RecordStatus =
  | 'DRAFT' | 'ACTIVE' | 'QUEUED' | 'SYNCED' | 'SYNC_FAILED' | 'INACTIVE';

export interface Equipment {
  id: string;
  assetCode?: string;
  tagNumber?: string;
  nameEn: string;
  nameTh?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  model?: string;
  submissionStatus: SubmissionStatus;
  recordStatus: RecordStatus;
  createdAt: string;
  updatedAt: string;
  supplier?: { name: string; supplierCode: string };
  location?: { storeCode: string; buildingZone?: string };
}

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  accountStatus: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  registrationType: 'BULK' | 'SINGLE';
  registeredAt: string;
  leadTimeDays?: number;
}

export const CATEGORIES: Record<string, string[]> = {
  'Chiller': [],
  'Cooling Tower': [],
  'Air Condition / AHU': [],
  'Refrigeration System': [],
  'Electrical System': ['Lighting', 'Transformer', 'Generator', 'Cap Bank', 'SVG', 'Other'],
  'Safety Equipment': ['CCTV', 'EAS', 'Fire Protection', 'Fire Pump', 'Gas Detector', 'Smoke Detector', 'Other'],
  'Waste Water System': ['Submerge Pump', 'Other'],
  'Super Equipment': ['Bakery Equipment', 'Delica Equipment', 'Butchery Equipment', 'Seafood Equipment', 'Produce Equipment', 'Other'],
  'General Home Use Equipment': [],
  'LED Signage': [],
  'Logistic Equipment': ['Overhead Door', 'Dock Leveler', 'Dock Shelter', 'Basket Washing Machine', 'Conveyor', 'Other'],
  'Shopping Trolley': [],
  'Small Equipment': ['Dish', 'Bowl', 'Spoon', 'Other'],
  'Fork Lift': [],
};

export const STATUS_COLORS: Record<SubmissionStatus | RecordStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  NOMINATED: 'bg-purple-100 text-purple-700',
  EXPORTED: 'bg-teal-100 text-teal-700',
  ACTIVE: 'bg-green-100 text-green-700',
  QUEUED: 'bg-orange-100 text-orange-700',
  SYNCED: 'bg-emerald-100 text-emerald-700',
  SYNC_FAILED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
};
