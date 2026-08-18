export interface ClientTransaction {
  id: string;
  type: 'debt' | 'payment' | 'alert';
  title: string;
  amount: string;
  amountColor: string;
  desc: string;
  date: string;
  status: string;
  badgeColor: string;
}

export interface Client {
  id: string;
  name: string;
  type: string;
  initial: string;
  avatarColor: string;
  avatarUrl?: string;
  idNum: string;
  phone: string;
  registeredDate?: string;
  debt: string;
  lastPayment?: string;
  dueDate?: string;
  creditStatus?: string;
  status: 'active' | 'overdue' | 'paid';
  statusText: string;
  statusColor: string;
  transactions?: ClientTransaction[];
}
