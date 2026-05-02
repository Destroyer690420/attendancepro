"use client";

import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { useStore, Worker, Attendance, AttendanceStatus, FinancialTransaction } from "@/store/useStore";
import { useState, useMemo, useCallback } from "react";
import { WorkerProfile } from "./WorkerProfile";

interface WorkerAttendanceDetailProps {
  worker: Worker;
  onBack: () => void;
  initialYear?: number;
  initialMonth?: number; // 0-indexed (0 = January)
  readOnly?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function WorkerAttendanceDetail({ worker, onBack, initialYear, initialMonth, readOnly = false }: WorkerAttendanceDetailProps) {
  const attendance = useStore((state) => state.attendance);
  const transactions = useStore((state) => state.transactions);
  const markAttendance = useStore((state) => state.markAttendance);
  const addTransaction = useStore((state) => state.addTransaction);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(initialYear ?? now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialMonth ?? now.getMonth()); // 0-indexed

  const workerAttendance = attendance.get(worker.id) || [];
  const workerTransactions = transactions.get(worker.id) || [];

  // Advance input states: keyed by date string
  const [advanceInputs, setAdvanceInputs] = useState<Record<string, string>>({});
  const [activeAdvanceDate, setActiveAdvanceDate] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const monthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}`;
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Build days array for the month
  const daysArray = useMemo(() => {
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthStr}-${d.toString().padStart(2, "0")}`;
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const dayName = DAYS[dateObj.getDay()];
      const record = workerAttendance.find((a) => a.date === dateStr);
      const dayAdvances = workerTransactions.filter(
        (t) => t.type === "advance" && t.date === dateStr
      );
      const dayAdvanceTotal = dayAdvances.reduce((sum, t) => sum + t.amount, 0);
      days.push({ day: d, dateStr, dayName, record, dayAdvanceTotal, isFuture: dateObj > now });
    }
    return days;
  }, [daysInMonth, monthStr, selectedYear, selectedMonth, workerAttendance, workerTransactions, now]);

  // Monthly summary
  const summary = useMemo(() => {
    const monthRecords = workerAttendance.filter((a) => a.date.startsWith(monthStr));
    const presentDays = monthRecords.filter((a) => a.status === "present").length;
    const halfDays = monthRecords.filter((a) => a.status === "half-day").length;
    const absentDays = monthRecords.filter((a) => a.status === "absent").length;
    const totalOtHours = monthRecords.reduce((sum, a) => sum + a.totalOtHours, 0);

    const monthAdvances = workerTransactions
      .filter((t) => t.type === "advance" && t.date.startsWith(monthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const salary =
      presentDays * worker.dailyWageRate +
      halfDays * 0.5 * worker.dailyWageRate +
      totalOtHours * worker.otRatePerHour;

    const effectivePresent = presentDays + halfDays * 0.5;

    return { presentDays, halfDays, absentDays, totalOtHours, salary, monthAdvances, effectivePresent };
  }, [workerAttendance, workerTransactions, monthStr, worker]);

  const handleMark = useCallback((dateStr: string, status: AttendanceStatus) => {
    const existing = workerAttendance.find((a) => a.date === dateStr);

    // If clicking the same status, toggle it off (set to null)
    const newStatus = existing?.status === status ? null : status;

    const record: Attendance = {
      id: existing?.id || `${worker.id}-${dateStr}`,
      workerId: worker.id,
      date: dateStr,
      status: newStatus,
      otHoursStart: existing?.otHoursStart,
      otHoursEnd: existing?.otHoursEnd,
      totalOtHours: existing?.totalOtHours || 0,
    };

    markAttendance(record);
  }, [workerAttendance, worker.id, markAttendance]);

  const handleAddAdvance = useCallback((dateStr: string) => {
    const amountStr = advanceInputs[dateStr];
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) return;

    const txn: FinancialTransaction = {
      id: `txn-${Date.now()}`,
      workerId: worker.id,
      type: "advance",
      amount: Number(amountStr),
      date: dateStr,
      notes: "Daily advance",
    };

    addTransaction(worker.id, txn);
    setAdvanceInputs((prev) => ({ ...prev, [dateStr]: "" }));
    setActiveAdvanceDate(null);
  }, [advanceInputs, worker.id, addTransaction]);

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };


  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {worker.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">{worker.name}</h2>
              <p className="text-xs text-gray-500 truncate">
                ₹{worker.dailyWageRate}/day • OT: ₹{worker.otRatePerHour}/hr
              </p>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 flex-shrink-0">
            <button onClick={goToPrevMonth} className="p-1 hover:bg-blue-100 rounded touch-manipulation">
              <ChevronLeft className="w-4 h-4 text-blue-700" />
            </button>
            <div className="flex items-center gap-1.5 px-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">
                {MONTHS[selectedMonth].slice(0, 3)} {selectedYear}
              </span>
            </div>
            <button onClick={goToNextMonth} className="p-1 hover:bg-blue-100 rounded touch-manipulation">
              <ChevronRight className="w-4 h-4 text-blue-700" />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Present</span>
            <span className="font-bold text-gray-900">{summary.effectivePresent}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Absent</span>
            <span className="font-bold text-gray-900">{summary.absentDays}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-gray-600">Half</span>
            <span className="font-bold text-gray-900">{summary.halfDays}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded">
            <span className="text-green-700 font-semibold">₹{summary.salary.toLocaleString()}</span>
          </div>
          {summary.monthAdvances > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded">
              <span className="text-red-600 font-semibold">-₹{summary.monthAdvances.toLocaleString()}</span>
            </div>
          )}
          {!readOnly && (
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium hover:bg-blue-100 transition-colors touch-manipulation ml-1"
            >
              <Wallet className="w-3 h-3" />
              Ledger
            </button>
          )}
        </div>
      </header>

      {/* Table Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="grid grid-cols-[60px_1fr_1fr] px-4 py-2.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">₹ Advance</span>
        </div>
      </div>

      {/* Scrollable Table Body */}
      <div className="flex-1 overflow-auto pb-4">
        {daysArray.map(({ day, dateStr, dayName, record, dayAdvanceTotal, isFuture }) => {
          const status = record?.status || null;
          const isToday = dateStr === now.toISOString().split("T")[0];
          const isAdvanceActive = activeAdvanceDate === dateStr;
          const isSunday = dayName === "Sun";

          return (
            <div
              key={dateStr}
              className={`grid grid-cols-[60px_1fr_1fr] items-center px-4 py-3 border-b border-gray-100 ${
                isToday ? "bg-blue-50/60" : isSunday ? "bg-red-50/30" : "bg-white"
              } ${isFuture ? "opacity-50" : ""}`}
            >
              {/* Date Column */}
              <div className="flex flex-col">
                <span className={`text-base font-bold ${isToday ? "text-blue-700" : "text-gray-900"}`}>
                  {day}
                </span>
                <span className={`text-xs ${isSunday ? "text-red-500 font-medium" : "text-gray-400"}`}>
                  {dayName}
                </span>
              </div>

              {/* Attendance Column */}
              <div className="flex items-center gap-1.5">
                {readOnly ? (
                  status ? (
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold ${
                      status === "present" ? "bg-green-600 text-white" :
                      status === "absent" ? "bg-red-600 text-white" :
                      status === "half-day" ? "bg-amber-500 text-white" : ""
                    }`}>
                      {status === "present" ? "P" : status === "absent" ? "A" : "½"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )
                ) : (
                  !isFuture && (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => handleMark(dateStr, "present")}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all touch-manipulation ${
                          status === "present"
                            ? "bg-green-600 text-white shadow-sm ring-2 ring-green-300"
                            : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700 border border-gray-200"
                        }`}
                      >
                        P
                      </button>
                      <button
                        onClick={() => handleMark(dateStr, "half-day")}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all touch-manipulation ${
                          status === "half-day"
                            ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-300"
                            : "bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-700 border border-gray-200"
                        }`}
                      >
                        ½
                      </button>
                      <button
                        onClick={() => handleMark(dateStr, "absent")}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all touch-manipulation ${
                          status === "absent"
                            ? "bg-red-600 text-white shadow-sm ring-2 ring-red-300"
                            : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700 border border-gray-200"
                        }`}
                      >
                        A
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Advance Column */}
              <div className="flex items-center justify-end gap-2">
                {dayAdvanceTotal > 0 ? (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                    ₹{dayAdvanceTotal.toLocaleString()}
                  </span>
                ) : readOnly ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : null}
                {!readOnly && !isFuture && (
                  <>
                    {isAdvanceActive ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="₹"
                          value={advanceInputs[dateStr] || ""}
                          onChange={(e) =>
                            setAdvanceInputs((prev) => ({ ...prev, [dateStr]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddAdvance(dateStr);
                            if (e.key === "Escape") setActiveAdvanceDate(null);
                          }}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddAdvance(dateStr)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium touch-manipulation"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setActiveAdvanceDate(null)}
                          className="text-xs text-gray-400 px-1 py-1 touch-manipulation"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveAdvanceDate(dateStr)}
                        className="text-xs text-gray-400 hover:text-blue-600 border border-dashed border-gray-300 hover:border-blue-400 rounded px-2 py-1 transition-colors touch-manipulation"
                      >
                        ₹ Advance
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showProfile && (
        <WorkerProfile
          worker={worker}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
