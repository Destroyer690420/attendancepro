"use client";

import { Users, DollarSign, Clock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useMemo } from "react";

export function SummaryCards() {
  const workers = useStore((state) => state.workers);
  const attendance = useStore((state) => state.attendance);
  const selectedDate = useStore((state) => state.selectedDate);

  const { presentCount, estimatedPayout, otHours } = useMemo(() => {
    let present = 0;
    let payout = 0;
    let ot = 0;

    workers.forEach((worker) => {
      const workerAttendance = attendance.get(worker.id) || [];
      const record = workerAttendance.find((a) => a.date === selectedDate);

      if (record?.status === "present") {
        present++;
        payout += worker.dailyWageRate + (record.totalOtHours * worker.otRatePerHour);
        ot += record.totalOtHours;
      } else if (record?.status === "half-day") {
        present++;
        payout += worker.dailyWageRate * 0.5;
      }
    });

    return { presentCount: present, estimatedPayout: payout, otHours: ot };
  }, [workers, attendance, selectedDate]);

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">Present</span>
        </div>
        <div className="text-2xl font-bold text-green-800">{presentCount}</div>
        <div className="text-xs text-green-600">of {workers.length}</div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <span className="text-sm text-orange-700">OT Hours</span>
        </div>
        <div className="text-2xl font-bold text-orange-800">{otHours.toFixed(1)}</div>
        <div className="text-xs text-orange-600">today</div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-blue-700">Est. Payout</span>
        </div>
        <div className="text-2xl font-bold text-blue-800">
          ${estimatedPayout.toLocaleString()}
        </div>
        <div className="text-xs text-blue-600">today</div>
      </div>
    </div>
  );
}