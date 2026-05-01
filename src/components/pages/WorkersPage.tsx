"use client";

import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useStore, Worker } from "@/store/useStore";
import { useMemo, useState } from "react";

export function WorkersPage() {
  const workers = useStore((state) => state.workers);
  const addWorker = useStore((state) => state.addWorker);
  const updateWorker = useStore((state) => state.updateWorker);
  const deleteWorker = useStore((state) => state.deleteWorker);
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dailyWageRate: "",
    otRatePerHour: "",
  });

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return workers;
    const query = searchQuery.toLowerCase();
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.phone.includes(query)
    );
  }, [workers, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const workerData: Worker = {
      id: editingWorker?.id || `worker-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      dailyWageRate: Number(formData.dailyWageRate),
      otRatePerHour: Number(formData.otRatePerHour),
      joiningDate: editingWorker?.joiningDate || new Date().toISOString().split("T")[0],
    };

    if (editingWorker) {
      updateWorker(editingWorker.id, workerData);
    } else {
      addWorker(workerData);
    }
    
    setFormData({ name: "", phone: "", dailyWageRate: "", otRatePerHour: "" });
    setShowForm(false);
    setEditingWorker(null);
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      dailyWageRate: worker.dailyWageRate.toString(),
      otRatePerHour: worker.otRatePerHour.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this worker?")) {
      deleteWorker(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingWorker(null);
    setFormData({ name: "", phone: "", dailyWageRate: "", otRatePerHour: "" });
  };

  return (
    <div className="flex-1 overflow-auto pb-20 p-4">
      <div className="relative mb-4">
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

      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium mb-4 flex items-center justify-center gap-2 touch-manipulation"
      >
        <Plus className="w-5 h-5" /> Add Worker
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
        >
          <h3 className="font-medium mb-3">
            {editingWorker ? "Edit Worker" : "Add New Worker"}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base"
              required
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base"
              required
            />
            <input
              type="number"
              placeholder="Daily Wage Rate"
              value={formData.dailyWageRate}
              onChange={(e) =>
                setFormData({ ...formData, dailyWageRate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base"
              required
            />
            <input
              type="number"
              placeholder="OT Rate per Hour"
              value={formData.otRatePerHour}
              onChange={(e) =>
                setFormData({ ...formData, otRatePerHour: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base"
              required
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium touch-manipulation"
            >
              {editingWorker ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between active:bg-gray-50"
          >
            <div>
              <div className="font-medium text-gray-900">{worker.name}</div>
              <div className="text-xs text-gray-500">{worker.phone}</div>
              <div className="text-xs text-gray-500">
                ₹{worker.dailyWageRate}/day • OT: ₹{worker.otRatePerHour}/hr
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(worker)}
                className="p-3 text-gray-500 hover:text-blue-600 touch-manipulation"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(worker.id)}
                className="p-3 text-gray-500 hover:text-red-600 touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkers.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-8">
          No workers yet. Add your first worker.
        </div>
      )}
    </div>
  );
}