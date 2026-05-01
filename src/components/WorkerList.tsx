"use client";

import { UserCheck, UserX, UserMinus, Clock, ChevronDown, ChevronUp, User, IndianRupee } from "lucide-react";
import { useStore, Attendance, AttendanceStatus } from "@/store/useStore";
import { useMemo, useState } from "react";
import { WorkerProfile } from "./WorkerProfile";

interface WorkerListProps {
  compact?: boolean;
  onWorkerClick?: (workerId: string) => void;
}

function calculateOtHours(start: string, end: string): number {
  if (!start || !end) return 0;
  
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) return 0;
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (endMinutes <= startMinutes) return 0;
  
  return (endMinutes - startMinutes) / 60;
}

export function WorkerList({ compact = false, onWorkerClick }: WorkerListProps) {
  const workers = useStore((state) => state.workers);
  const attendance = useStore((state) => state.attendance);
  const transactions = useStore((state) => state.transactions);
  const selectedDate = useStore((state) => state.selectedDate);
  const searchQuery = useStore((state) => state.searchQuery);
  const markAttendance = useStore((state) => state.markAttendance);
  const addTransaction = useStore((state) => state.addTransaction);
  
  const [expandedOt, setExpandedOt] = useState<string | null>(null);
  const [otStart, setOtStart] = useState<Record<string, string>>({});
  const [otEnd, setOtEnd] = useState<Record<string, string>>({});
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [advanceModal, setAdvanceModal] = useState<{workerId: string; amount: string} | null>(null);
  const [advanceError, setAdvanceError] = useState("");

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return workers;
    const query = searchQuery.toLowerCase();
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.phone.includes(query)
    );
  }, [workers, searchQuery]);

  const getWorkerRecord = (workerId: string): Attendance | undefined => {
    const records = attendance.get(workerId) || [];
    return records.find((a) => a.date === selectedDate);
  };

  const getWorkerAdvances = (workerId: string): number => {
    const workerTxns = transactions.get(workerId) || [];
    return workerTxns
      .filter((t) => t.type === "advance")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleMark = (workerId: string, status: AttendanceStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = attendance.get(workerId) || [];
    const existingRecord = existing.find((a) => a.date === selectedDate);
    
    const record: Attendance = {
      id: existingRecord?.id || `${workerId}-${selectedDate}`,
      workerId,
      date: selectedDate,
      status,
      otHoursStart: otStart[workerId] || existingRecord?.otHoursStart,
      otHoursEnd: otEnd[workerId] || existingRecord?.otHoursEnd,
      totalOtHours: existingRecord?.totalOtHours || 0,
    };
    
    markAttendance(record);
  };

  const handleOtTimeChange = (workerId: string, field: "start" | "end", value: string) => {
    if (field === "start") {
      setOtStart((prev) => ({ ...prev, [workerId]: value }));
    } else {
      setOtEnd((prev) => ({ ...prev, [workerId]: value }));
    }
    
    const record = getWorkerRecord(workerId);
    const startTime = field === "start" ? value : (otStart[workerId] || record?.otHoursStart || "");
    const endTime = field === "end" ? value : (otEnd[workerId] || record?.otHoursEnd || "");
    
    const hours = calculateOtHours(startTime, endTime);
    const existing = attendance.get(workerId) || [];
    const existingRecord = existing.find((a) => a.date === selectedDate);
    
    const newRecord: Attendance = {
      id: existingRecord?.id || `${workerId}-${selectedDate}`,
      workerId,
      date: selectedDate,
      status: existingRecord?.status || "present",
      otHoursStart: startTime,
      otHoursEnd: endTime,
      totalOtHours: hours,
    };
    
    markAttendance(newRecord);
  };

  const toggleOtExpand = (workerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOt((prev) => (prev === workerId ? null : workerId));
  };

  const handleWorkerClick = (workerId: string) => {
    if (onWorkerClick) {
      onWorkerClick(workerId);
    } else {
      setSelectedWorkerId(workerId);
    }
  };

  const handleQuickAdvance = (workerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const amount = prompt("Enter advance amount:");
    if (!amount || isNaN(Number(amount))) return;
    
    const txn = {
      id: `txn-${Date.now()}`,
      workerId,
      type: "advance" as const,
      amount: Number(amount),
      date: selectedDate,
      notes: "Quick advance",
    };
    
    addTransaction(workerId, txn);
  };

  const getStatusColor = (status: AttendanceStatus, hasAdvances: boolean) => {
    if (hasAdvances) return "bg-yellow-500";
    switch (status) {
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      case "half-day":
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <UserCheck className="w-4 h-4 text-white" />;
      case "absent":
        return <UserX className="w-4 h-4 text-white" />;
      case "half-day":
        return <UserMinus className="w-4 h-4 text-white" />;
      default:
        return <User className="w-4 h-4 text-white" />;
    }
  };

  const selectedWorker = selectedWorkerId 
    ? workers.find((w) => w.id === selectedWorkerId) 
    : null;

  if (filteredWorkers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No workers found. Add workers from the Workers tab.</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-4">
        {filteredWorkers.map((worker) => {
          const record = getWorkerRecord(worker.id);
          const status = record?.status || null;
          const isExpanded = expandedOt === worker.id;
          const workerOtStart = otStart[worker.id] || record?.otHoursStart || "";
          const workerOtEnd = otEnd[worker.id] || record?.otHoursEnd || "";
          const otHours = record?.totalOtHours || calculateOtHours(workerOtStart, workerOtEnd);
          const advances = getWorkerAdvances(worker.id);
          const hasAdvances = advances > 0;
          
          return (
            <div
              key={worker.id}
              onClick={() => handleWorkerClick(worker.id)}
              className={`bg-white border rounded-lg mb-2 p-3 active:bg-gray-50 ${
                hasAdvances ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(
                      status,
                      hasAdvances
                    )}`}
                  >
                    {getStatusIcon(status)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{worker.name}</div>
                    <div className="text-xs text-gray-500">
                      ₹{worker.dailyWageRate}/day • OT: ₹{worker.otRatePerHour}/hr
                    </div>
                  </div>
                </div>
                {hasAdvances && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    ₹{advances.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={(e) => handleMark(worker.id, "present", e)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                    status === "present"
                      ? "bg-green-500 text-white"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={(e) => handleMark(worker.id, "half-day", e)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                    status === "half-day"
                      ? "bg-yellow-500 text-white"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  }`}
                >
                  Half Day
                </button>
                <button
                  onClick={(e) => handleMark(worker.id, "absent", e)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                    status === "absent"
                      ? "bg-red-500 text-white"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  Absent
                </button>
              </div>

              {(status === "present" || status === "half-day") && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => toggleOtExpand(worker.id, e)}
                    className="flex items-center gap-2 text-sm text-gray-600 w-full"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Overtime {otHours > 0 && `(${otHours.toFixed(1)} hrs)`}</span>
                    <span className="ml-auto">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          From Time
                        </label>
                        <input
                          type="time"
                          value={workerOtStart}
                          onChange={(e) => handleOtTimeChange(worker.id, "start", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          To Time
                        </label>
                        <input
                          type="time"
                          value={workerOtEnd}
                          onChange={(e) => handleOtTimeChange(worker.id, "end", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedWorker && (
        <WorkerProfile
          worker={selectedWorker}
          onClose={() => setSelectedWorkerId(null)}
        />
      )}
    </>
  );
}