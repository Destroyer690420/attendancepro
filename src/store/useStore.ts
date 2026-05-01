import { create } from "zustand";
import {
  loadWorkers,
  saveWorker,
  updateWorkerInDb,
  deleteWorkerFromDb,
  saveAttendance,
  saveTransactions,
} from "@/lib/firestore";
import {
  saveWorkersToLocal,
  loadWorkersFromLocal,
  saveAttendanceToLocal,
  loadAttendanceFromLocal,
  saveTransactionsToLocal,
  loadTransactionsFromLocal,
} from "@/lib/localStorage";

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

interface AppState {
  workers: Worker[];
  attendance: Map<string, Attendance[]>;
  transactions: Map<string, FinancialTransaction[]>;
  selectedDate: string;
  searchQuery: string;
  isLoading: boolean;
  isInitialized: boolean;
  isOffline: boolean;
  
  initialize: () => Promise<void>;
  setWorkers: (workers: Worker[]) => void;
  addWorker: (worker: Worker) => Promise<void>;
  updateWorker: (id: string, data: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  
  setAttendance: (workerId: string, records: Attendance[]) => void;
  markAttendance: (record: Attendance) => Promise<void>;
  
  setTransactions: (workerId: string, records: FinancialTransaction[]) => void;
  addTransaction: (workerId: string, record: FinancialTransaction) => Promise<void>;
  
  setSelectedDate: (date: string) => void;
  setSearchQuery: (query: string) => void;
}

const getToday = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

export const useStore = create<AppState>((set, get) => ({
  workers: [],
  attendance: new Map(),
  transactions: new Map(),
  selectedDate: getToday(),
  searchQuery: "",
  isLoading: true,
  isInitialized: false,
  isOffline: false,

  initialize: async () => {
    set({ isLoading: true });
    
    const cachedWorkers = loadWorkersFromLocal();
    const attendanceMap = new Map<string, Attendance[]>();
    const transactionsMap = new Map<string, FinancialTransaction[]>();
    
    if (cachedWorkers.length > 0) {
      for (const worker of cachedWorkers) {
        const attendance = loadAttendanceFromLocal(worker.id);
        const transactions = loadTransactionsFromLocal(worker.id);
        if (attendance.length > 0) {
          attendanceMap.set(worker.id, attendance);
        }
        if (transactions.length > 0) {
          transactionsMap.set(worker.id, transactions);
        }
      }
      
      set({
        workers: cachedWorkers,
        attendance: attendanceMap,
        transactions: transactionsMap,
        isLoading: false,
        isInitialized: true,
      });
    }

    try {
      const workers = await loadWorkers();
      if (workers.length > 0) {
        for (const worker of workers) {
          const attendance = loadAttendanceFromLocal(worker.id);
          const transactions = loadTransactionsFromLocal(worker.id);
          if (attendance.length > 0) {
            attendanceMap.set(worker.id, attendance);
          }
          if (transactions.length > 0) {
            transactionsMap.set(worker.id, transactions);
          }
        }
        
        saveWorkersToLocal(workers);
        set({
          workers,
          attendance: attendanceMap,
          transactions: transactionsMap,
          isLoading: false,
          isInitialized: true,
          isOffline: false,
        });
      } else if (cachedWorkers.length > 0) {
        set({
          isLoading: false,
          isInitialized: true,
          isOffline: true,
        });
      } else {
        set({ isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error("Firebase error, using local data:", error);
      if (cachedWorkers.length > 0) {
        set({
          isLoading: false,
          isInitialized: true,
          isOffline: true,
        });
      } else {
        set({ isLoading: false, isInitialized: true, isOffline: true });
      }
    }
  },

  setWorkers: (workers) => {
    saveWorkersToLocal(workers);
    set({ workers });
  },
  
  addWorker: async (worker) => {
    set((state) => ({ 
      workers: [...state.workers, worker] 
    }));
    saveWorkersToLocal(get().workers);
    
    try {
      await saveWorker(worker);
    } catch (error) {
      console.error("Offline: Worker saved locally only");
    }
  },
  
  updateWorker: async (id, data) => {
    set((state) => ({
      workers: state.workers.map((w) => 
        w.id === id ? { ...w, ...data } : w
      ),
    }));
    saveWorkersToLocal(get().workers);
    
    try {
      await updateWorkerInDb(id, data as Worker);
    } catch (error) {
      console.error("Offline: Worker update saved locally only");
    }
  },
  
  deleteWorker: async (id) => {
    set((state) => ({
      workers: state.workers.filter((w) => w.id !== id),
    }));
    saveWorkersToLocal(get().workers);
    
    try {
      await deleteWorkerFromDb(id);
    } catch (error) {
      console.error("Offline: Worker deletion saved locally only");
    }
  },

  setAttendance: (workerId, records) => {
    saveAttendanceToLocal(workerId, records);
    const newAttendance = new Map(get().attendance);
    newAttendance.set(workerId, records);
    set({ attendance: newAttendance });
  },

  markAttendance: async (record) => {
    const state = get();
    const newAttendance = new Map(state.attendance);
    const existing = newAttendance.get(record.workerId) || [];
    const index = existing.findIndex((a) => a.date === record.date);
    
    if (index >= 0) {
      existing[index] = record;
    } else {
      existing.push(record);
    }
    
    newAttendance.set(record.workerId, existing);
    set({ attendance: newAttendance });
    saveAttendanceToLocal(record.workerId, existing);
    
    try {
      await saveAttendance(record.workerId, existing);
    } catch (error) {
      console.error("Offline: Attendance saved locally only");
    }
  },

  setTransactions: (workerId, records) => {
    saveTransactionsToLocal(workerId, records);
    const newTransactions = new Map(get().transactions);
    newTransactions.set(workerId, records);
    set({ transactions: newTransactions });
  },

  addTransaction: async (workerId, record) => {
    const state = get();
    const newTransactions = new Map(state.transactions);
    const existing = newTransactions.get(workerId) || [];
    existing.push(record);
    newTransactions.set(workerId, existing);
    set({ transactions: newTransactions });
    saveTransactionsToLocal(workerId, existing);
    
    try {
      await saveTransactions(workerId, existing);
    } catch (error) {
      console.error("Offline: Transaction saved locally only");
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));