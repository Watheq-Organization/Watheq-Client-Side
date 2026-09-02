export type CustomerStatus = 'overdue' | 'active_debt' | 'paid';
export type CustomerType = 'individual' | 'company';

export interface CustomerTransaction {
  id: string;
  date: string;
  type: 'debt' | 'payment';
  typeLabel: string;
  amount: number;
  status: 'completed' | 'pending' | 'overdue';
  statusLabel: string;
  invoiceNumber: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  typeLabel: string;
  nationalOrCrId: string;
  totalDebt: number;
  totalPaid?: number;
  status: CustomerStatus;
  statusLabel: string;
  avatarLetter: string;
  avatarBg: string;
  phone?: string;
  email?: string;
  address?: string;
  registrationDate?: string;
  transactions?: CustomerTransaction[];
}
