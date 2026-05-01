import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDocFromCache,
  getDocsFromCache,
} from "firebase/firestore";
import { Worker, Attendance, FinancialTransaction } from "@/store/useStore";

const COLLECTIONS = {
  workers: "workers",
  attendance: "attendance",
  transactions: "transactions",
};

interface LoadDataResult {
  workers: Worker[];
  attendance: Map<string, Attendance[]>;
  transactions: Map<string, FinancialTransaction[]>;
}

// Firestore rejects `undefined` values. This recursively strips them,
// replacing with null (which Firestore accepts) or removing them entirely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

// Timeout wrapper — never wait longer than `ms` for a Firestore operation
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// Try cache first, fall back to network. This is the key to fast loading.
async function getDocsFast(collectionRef: ReturnType<typeof collection>) {
  try {
    const cached = await getDocsFromCache(collectionRef);
    if (!cached.empty) {
      // Return cache immediately, refresh in background
      getDocs(collectionRef).catch(() => {});
      return cached;
    }
  } catch {
    // No cache available, that's fine
  }
  // Fall back to network with timeout
  return withTimeout(getDocs(collectionRef), 8000);
}

async function getDocFast(docRef: ReturnType<typeof doc>) {
  try {
    const cached = await getDocFromCache(docRef);
    if (cached.exists()) {
      // Return cache immediately, refresh in background
      getDoc(docRef).catch(() => {});
      return cached;
    }
  } catch {
    // No cache available
  }
  return withTimeout(getDoc(docRef), 8000);
}

export async function loadWorkers(): Promise<Worker[]> {
  try {
    const workersSnapshot = await getDocsFast(collection(db, COLLECTIONS.workers));
    const workers: Worker[] = [];
    workersSnapshot.forEach((docSnap) => {
      workers.push({ id: docSnap.id, ...docSnap.data() } as Worker);
    });
    return workers;
  } catch (error) {
    console.error("Error loading workers:", error);
    return [];
  }
}

export async function loadAttendanceForWorker(workerId: string): Promise<Attendance[]> {
  try {
    const attendanceDoc = await getDocFast(doc(db, COLLECTIONS.attendance, workerId));
    if (attendanceDoc.exists()) {
      const data = attendanceDoc.data();
      return (data.records || []) as Attendance[];
    }
    return [];
  } catch (error) {
    console.error("Error loading attendance:", error);
    return [];
  }
}

export async function loadTransactionsForWorker(workerId: string): Promise<FinancialTransaction[]> {
  try {
    const transactionsDoc = await getDocFast(doc(db, COLLECTIONS.transactions, workerId));
    if (transactionsDoc.exists()) {
      const data = transactionsDoc.data();
      return (data.records || []) as FinancialTransaction[];
    }
    return [];
  } catch (error) {
    console.error("Error loading transactions:", error);
    return [];
  }
}

export async function saveWorker(worker: Worker): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.workers, worker.id), sanitizeForFirestore(worker));
  } catch (error) {
    console.error("Error saving worker:", error);
    throw error;
  }
}

export async function updateWorkerInDb(workerId: string, data: Partial<Worker>): Promise<void> {
  try {
    const workerData = sanitizeForFirestore(data) as Record<string, unknown>;
    await updateDoc(doc(db, COLLECTIONS.workers, workerId), workerData);
  } catch (error) {
    console.error("Error updating worker:", error);
    throw error;
  }
}

export async function deleteWorkerFromDb(workerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.workers, workerId));
    await deleteDoc(doc(db, COLLECTIONS.attendance, workerId));
    await deleteDoc(doc(db, COLLECTIONS.transactions, workerId));
  } catch (error) {
    console.error("Error deleting worker:", error);
    throw error;
  }
}

export async function saveAttendance(workerId: string, records: Attendance[]): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.attendance, workerId), { records: sanitizeForFirestore(records) });
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw error;
  }
}

export async function saveTransactions(workerId: string, records: FinancialTransaction[]): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.transactions, workerId), { records: sanitizeForFirestore(records) });
  } catch (error) {
    console.error("Error saving transactions:", error);
    throw error;
  }
}