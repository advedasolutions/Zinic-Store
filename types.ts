
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  HOTEL_ADMIN = 'HOTEL_ADMIN',
  DEPT_USER = 'DEPT_USER',
  APPROVER = 'APPROVER',
  VIEWER = 'VIEWER'
}

export type UserPermission = 'MANAGE_USERS' | 'APPROVE_REQUESTS' | 'MANAGE_INVENTORY' | 'MANAGE_CONSUMPTION' | 'MANAGE_FINANCE';

export const DEFAULT_DEPARTMENTS = [
  'Main Store',
  'Kitchen',
  'Housekeeping',
  'F&B',
  'Maintenance',
  'Admin'
];

export type Department = string;

export type PaymentMode = 'CREDIT' | 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';

export interface User {
  id: string;
  clientId: string;
  username: string;
  fullName: string;
  email?: string;
  role: UserRole;
  department: Department;
  permissions: UserPermission[];
  password?: string;
}

export interface Hotel {
  id: string;
  name: string;
  isActive: boolean;
  maxUsers: number;
  maxItems: number;
  contactEmail?: string;
  createdAt: string;
}

export interface DemoLead {
  id: string;
  fullName: string;
  hotelName: string;
  position: string;
  location: string;
  email: string;
  mobile: string;
  registeredAt: string;
  expiresAt: string;
  clientId: string;
  status: 'PENDING' | 'VERIFIED';
}

export interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  paymentMode: PaymentMode;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
}

export interface Vendor {
  id: string;
  clientId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  invoices: VendorInvoice[];
}

export interface InventoryItem {
  id: string;
  clientId: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  vendorId?: string;
  lastUpdated: string;
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TRANSFERRED = 'TRANSFERRED',
  CONSUMED = 'CONSUMED'
}

export interface ConsumptionLog {
  id: string;
  amount: number;
  remark: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface StockRequest {
  id: string;
  clientId: string;
  requesterId: string;
  requesterName: string;
  department: Department;
  items: { 
    itemId: string; 
    itemName: string; 
    quantity: number; 
    consumedQuantity: number;
    logs?: ConsumptionLog[];
  }[];
  status: RequestStatus;
  requestedAt: string;
  notes?: string;
}

export interface AuthSession {
  user: User | null;
  hotel: Hotel | null;
  isAuthenticated: boolean;
  isDemo?: boolean;
}
