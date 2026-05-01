export type AttendanceStatus = "present" | "absent" | "half-day" | null;

export interface Worker {
  id: string;
  name: string;
  phone: string;
  dailyWageRate: number;
  otRatePerHour: number;
  joiningDate: string;
}

export interface Attendance {
  id: string;
  workerId: string;
  date: string;
  status: AttendanceStatus;
  otHoursStart?: string;
  otHoursEnd?: string;
  totalOtHours: number;
}

export interface FinancialTransaction {
  id: string;
  workerId: string;
  type: "advance" | "balance_credit" | "bonus";
  amount: number;
  date: string;
  notes: string;
}