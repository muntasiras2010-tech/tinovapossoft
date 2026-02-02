
export type WorkStatus = 'Pending' | 'Confirmed' | 'Success' | 'Cancelled';

export interface Order {
  id: string;
  inv: string;
  name: string;
  phone: string;
  service: string;
  paid: number;
  due: number;
  total: number;
  workStatus: WorkStatus;
  date: string;
}

export interface Stats {
  income: number;
  dueTotal: number;
  successCount: number;
  pendingCount: number;
}
