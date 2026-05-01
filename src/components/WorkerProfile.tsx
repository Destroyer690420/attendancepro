"use client";

import { X, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useStore, Worker, FinancialTransaction } from "@/store/useStore";
import { useState } from "react";

interface WorkerProfileProps {
  worker: Worker;
  onClose: () => void;
}

export function WorkerProfile({ worker, onClose }: WorkerProfileProps) {
  const transactions = useStore((state) => state.transactions);
  const addTransaction = useStore((state) => state.addTransaction);
  const attendance = useStore((state) => state.attendance);
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<"advance" | "bonus" | "balance_credit">("advance");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const workerTransactions = transactions.get(worker.id) || [];

  const totalAdvances = workerTransactions
    .filter((t) => t.type === "advance")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBonuses = workerTransactions
    .filter((t) => t.type === "bonus")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevBalance = workerTransactions
    .filter((t) => t.type === "balance_credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const workerAttendance = attendance.get(worker.id) || [];
  const todayRecord = workerAttendance.find((a) => a.date === new Date().toISOString().split("T")[0]);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthAttendance = workerAttendance.filter((a) => a.date.startsWith(thisMonth));
  
  const presentDays = monthAttendance.filter((a) => a.status === "present").length;
  const halfDays = monthAttendance.filter((a) => a.status === "half-day").length;
  const totalOtHours = monthAttendance.reduce((sum, a) => sum + a.totalOtHours, 0);

  const monthSalary =
    presentDays * worker.dailyWageRate +
    halfDays * 0.5 * worker.dailyWageRate +
    totalOtHours * worker.otRatePerHour;

  const netPayable = monthSalary + prevBalance - totalAdvances;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const transaction: FinancialTransaction = {
      id: `txn-${Date.now()}`,
      workerId: worker.id,
      type: transactionType,
      amount: Number(amount),
      date: new Date().toISOString().split("T")[0],
      notes,
    };

    addTransaction(worker.id, transaction);
    setAmount("");
    setNotes("");
    setShowTransactionForm(false);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{worker.name}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Phone</span>
              <div className="font-medium">{worker.phone}</div>
            </div>
            <div>
              <span className="text-gray-500">Daily Rate</span>
              <div className="font-medium">₹{worker.dailyWageRate}</div>
            </div>
            <div>
              <span className="text-gray-500">OT Rate/hr</span>
              <div className="font-medium">₹{worker.otRatePerHour}</div>
            </div>
            <div>
              <span className="text-gray-500">Joined</span>
              <div className="font-medium">{formatDate(worker.joiningDate)}</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700 mb-1">This Month</div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <div className="text-xl font-bold text-green-800">{presentDays}</div>
              <div className="text-xs text-green-600">Present</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-800">{halfDays}</div>
              <div className="text-xs text-green-600">Half</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-800">{totalOtHours.toFixed(1)}</div>
              <div className="text-xs text-green-600">OT hrs</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-800">₹{monthSalary.toLocaleString()}</div>
              <div className="text-xs text-green-600">Salary</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-yellow-700">Ledger</span>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="text-xs bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm mb-3">
            <div>
              <div className="text-gray-500">Advances</div>
              <div className="font-medium text-red-600">-₹{totalAdvances.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Bonuses</div>
              <div className="font-medium text-green-600">+₹{totalBonuses.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Prev. Balance</div>
              <div className="font-medium text-green-600">+₹{prevBalance.toLocaleString()}</div>
            </div>
          </div>
          <div className="border-t border-yellow-200 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Net Payable</span>
              <span className="font-bold text-green-700">
                ₹{netPayable.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {showTransactionForm && (
          <form onSubmit={handleAddTransaction} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-3">Add Transaction</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(["advance", "bonus", "balance_credit"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTransactionType(type)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      transactionType === type
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {type === "advance"
                      ? "Advance"
                      : type === "bonus"
                      ? "Bonus"
                      : "Carry Fwd"}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowTransactionForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {workerTransactions.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Transaction History</h3>
            <div className="space-y-2">
              {[...workerTransactions]
                .reverse()
                .slice(0, 10)
                .map((txn) => (
                  <div
                    key={txn.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          txn.type === "advance"
                            ? "bg-red-100"
                            : txn.type === "bonus"
                            ? "bg-green-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {txn.type === "advance" ? (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {txn.type.replace("_", " ")}
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(txn.date)}</div>
                      </div>
                    </div>
                    <div
                      className={`font-medium ${
                        txn.type === "advance" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {txn.type === "advance" ? "-" : "+"}₹{txn.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}