import { Worker, Attendance, FinancialTransaction } from "@/store/useStore";

const STORAGE_KEYS = {
  workers: "attendance_workers",
  attendance: "attendance_records",
  transactions: "attendance_transactions",
};

export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
}

export function saveWorkersToLocal(workers: Worker[]): void {
  saveToLocalStorage(STORAGE_KEYS.workers, workers);
}

export function loadWorkersFromLocal(): Worker[] {
  return loadFromLocalStorage<Worker[]>(STORAGE_KEYS.workers) || [];
}

export function saveAttendanceToLocal(workerId: string, records: Attendance[]): void {
  const allAttendance = loadFromLocalStorage<Record<string, Attendance[]>>(STORAGE_KEYS.attendance) || {};
  allAttendance[workerId] = records;
  saveToLocalStorage(STORAGE_KEYS.attendance, allAttendance);
}

export function loadAttendanceFromLocal(workerId: string): Attendance[] {
  const allAttendance = loadFromLocalStorage<Record<string, Attendance[]>>(STORAGE_KEYS.attendance) || {};
  return allAttendance[workerId] || [];
}

export function saveTransactionsToLocal(workerId: string, records: FinancialTransaction[]): void {
  const allTransactions = loadFromLocalStorage<Record<string, FinancialTransaction[]>>(STORAGE_KEYS.transactions) || {};
  allTransactions[workerId] = records;
  saveToLocalStorage(STORAGE_KEYS.transactions, allTransactions);
}

export function loadTransactionsFromLocal(workerId: string): FinancialTransaction[] {
  const allTransactions = loadFromLocalStorage<Record<string, FinancialTransaction[]>>(STORAGE_KEYS.transactions) || {};
  return allTransactions[workerId] || [];
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.workers);
    localStorage.removeItem(STORAGE_KEYS.attendance);
    localStorage.removeItem(STORAGE_KEYS.transactions);
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}

export function exportDataAsJson(): string {
  const data = {
    workers: loadWorkersFromLocal(),
    attendance: loadFromLocalStorage<Record<string, Attendance[]>>(STORAGE_KEYS.attendance) || {},
    transactions: loadFromLocalStorage<Record<string, FinancialTransaction[]>>(STORAGE_KEYS.transactions) || {},
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}