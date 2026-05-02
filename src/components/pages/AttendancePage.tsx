"use client";

import { Search, X, User, ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useMemo, useState } from "react";
import { WorkerAttendanceDetail } from "@/components/WorkerAttendanceDetail";

export function AttendancePage() {
  const workers = useStore((state) => state.workers);
  const attendance = useStore((state) => state.attendance);
  const transactions = useStore((state) => state.transactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return workers;
    const query = searchQuery.toLowerCase();
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.phone.includes(query)
    );
  }, [workers, searchQuery]);

  // Get today's date and current month
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const getWorkerSummary = (workerId: string) => {
    const workerAttendance = attendance.get(workerId) || [];
    const monthRecords = workerAttendance.filter((a) => a.date.startsWith(thisMonth));
    const todayRecord = workerAttendance.find((a) => a.date === today);

    const presentDays = monthRecords.filter((a) => a.status === "present").length;
    const halfDays = monthRecords.filter((a) => a.status === "half-day").length;
    const absentDays = monthRecords.filter((a) => a.status === "absent").length;

    const workerTransactions = transactions.get(workerId) || [];
    const monthAdvances = workerTransactions
      .filter((t) => t.type === "advance" && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    return { todayStatus: todayRecord?.status || null, presentDays, halfDays, absentDays, monthAdvances };
  };

  const selectedWorker = selectedWorkerId
    ? workers.find((w) => w.id === selectedWorkerId)
    : null;

  if (selectedWorker) {
    return (
      <WorkerAttendanceDetail
        worker={selectedWorker}
        onBack={() => setSelectedWorkerId(null)}
      />
    );
  }

  const getStatusDot = (status: string | null) => {
    switch (status) {
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      case "half-day":
        return "bg-amber-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "present":
        return "Present today";
      case "absent":
        return "Absent today";
      case "half-day":
        return "Half day today";
      default:
        return "Not marked today";
    }
  };

  return (
    <div className="flex-1 overflow-auto pb-20">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl h-12 px-4 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search workers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1.5 hover:bg-gray-100 rounded-lg touch-manipulation"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Worker List */}
      <div className="px-4 space-y-2 mt-1">
        {filteredWorkers.map((worker) => {
          const summary = getWorkerSummary(worker.id);
          return (
            <button
              key={worker.id}
              onClick={() => setSelectedWorkerId(worker.id)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors shadow-sm touch-manipulation text-left"
            >
              {/* Avatar with status indicator */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {worker.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusDot(summary.todayStatus)}`} />
              </div>

              {/* Worker Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{worker.name}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {summary.monthAdvances > 0 && (
                      <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                        -₹{summary.monthAdvances.toLocaleString()}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    ₹{worker.dailyWageRate}/day
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className={`text-xs ${summary.todayStatus ? "font-medium" : "text-gray-400"} ${
                    summary.todayStatus === "present" ? "text-green-600" :
                    summary.todayStatus === "absent" ? "text-red-500" :
                    summary.todayStatus === "half-day" ? "text-amber-600" : ""
                  }`}>
                    {getStatusLabel(summary.todayStatus)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                    {summary.presentDays}P
                  </span>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                    {summary.halfDays}H
                  </span>
                  <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                    {summary.absentDays}A
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">this month</span>
                </div>
              </div>
            </button>
          );
        })}

        {filteredWorkers.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium">No workers found</p>
            <p className="text-xs text-gray-400 mt-1">Add workers from the Workers tab</p>
          </div>
        )}
      </div>
    </div>
  );
}