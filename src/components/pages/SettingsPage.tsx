"use client";

import { Calendar } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState } from "react";

export function SettingsPage() {
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="flex-1 overflow-auto pb-20 p-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="font-medium">Select Date</span>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <div className="mt-2 text-sm text-gray-500">
          Selected: {formatDate(selectedDate)}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-3">About</h3>
        <div className="text-sm text-gray-500 space-y-2">
          <p>Daily Wage & Attendance Manager</p>
          <p>Version 1.0.0</p>
          <p className="text-xs mt-4">
            Data is stored locally in your browser. Clear cache to reset.
          </p>
        </div>
      </div>
    </div>
  );
}