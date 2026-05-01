"use client";

import { SummaryCards } from "@/components/SummaryCards";
import { SearchBar } from "@/components/SearchBar";
import { WorkerList } from "@/components/WorkerList";
import { useStore } from "@/store/useStore";

export function AttendancePage() {
  const searchQuery = useStore((state) => state.searchQuery);

  return (
    <div className="flex-1 overflow-auto pb-20">
      <SummaryCards />
      <SearchBar />
      <WorkerList />
    </div>
  );
}