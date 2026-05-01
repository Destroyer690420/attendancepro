"use client";

import { Calendar, Search, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useMemo, useState } from "react";

export function ReportsPage() {
  const workers = useStore((state) => state.workers);
  const attendance = useStore((state) => state.attendance);
  const transactions = useStore((state) => state.transactions);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [searchQuery, setSearchQuery] = useState("");

  const payrollData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStr = selectedMonth;

    return workers.map((worker) => {
      const workerAttendance = attendance.get(worker.id) || [];
      const workerTransactions = transactions.get(worker.id) || [];

      let presentDays = 0;
      let halfDays = 0;
      let totalOtHours = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${monthStr}-${day.toString().padStart(2, "0")}`;
        const record = workerAttendance.find((a) => a.date === dateStr);
        
        if (record?.status === "present") {
          presentDays++;
          totalOtHours += record.totalOtHours;
        } else if (record?.status === "half-day") {
          halfDays++;
          totalOtHours += record.totalOtHours;
        }
      }

      const salary =
        presentDays * worker.dailyWageRate +
        halfDays * 0.5 * worker.dailyWageRate +
        totalOtHours * worker.otRatePerHour;

      const advances = workerTransactions
        .filter((t) => t.type === "advance" && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const bonuses = workerTransactions
        .filter((t) => t.type === "bonus" && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const prevBalance = workerTransactions
        .filter((t) => t.type === "balance_credit")
        .reduce((sum, t) => sum + t.amount, 0);

      const netPayable = salary + prevBalance - advances;

      return {
        worker,
        presentDays,
        halfDays,
        totalOtHours,
        salary,
        advances,
        bonuses,
        prevBalance,
        netPayable,
      };
    });
  }, [workers, attendance, transactions, selectedMonth]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return payrollData;
    const query = searchQuery.toLowerCase();
    return payrollData.filter(
      (d) =>
        d.worker.name.toLowerCase().includes(query) ||
        d.worker.phone.includes(query)
    );
  }, [payrollData, searchQuery]);

  const totals = useMemo(() => {
    return payrollData.reduce(
      (acc, d) => ({
        present: acc.present + d.presentDays,
        half: acc.half + d.halfDays,
        ot: acc.ot + d.totalOtHours,
        salary: acc.salary + d.salary,
        advances: acc.advances + d.advances,
        net: acc.net + d.netPayable,
      }),
      { present: 0, half: 0, ot: 0, salary: 0, advances: 0, net: 0 }
    );
  }, [payrollData]);

  return (
    <div className="flex-1 overflow-auto pb-20">
      <div className="p-4 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-9 py-2 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600">Present</div>
            <div className="text-xl font-bold text-green-700">{totals.present}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-xs text-yellow-600">Half Days</div>
            <div className="text-xl font-bold text-yellow-700">{totals.half}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs text-orange-600">OT Hours</div>
            <div className="text-xl font-bold text-orange-700">{totals.ot.toFixed(1)}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-600">Total Payout</div>
            <div className="text-xl font-bold text-blue-700">
              ${totals.net.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {filteredData.map((data) => (
          <div
            key={data.worker.id}
            className="bg-white border border-gray-200 rounded-lg p-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{data.worker.name}</div>
                <div className="text-xs text-gray-500">
                  <span className="text-green-600">{data.presentDays} P</span>
                  {" · "}
                  <span className="text-yellow-600">{data.halfDays} HD</span>
                  {" · "}
                  <span className="text-orange-600">{data.totalOtHours.toFixed(1)} OT</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  ${data.netPayable.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">net</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>${data.salary.toLocaleString()}</span>
              <span className="text-red-600">-${data.advances.toLocaleString()}</span>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No workers found
          </div>
        )}
      </div>
    </div>
  );
}