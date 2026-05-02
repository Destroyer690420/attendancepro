"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BottomNav } from "@/components/BottomNav";
import { AttendancePage } from "@/components/pages/AttendancePage";
import { WorkersPage } from "@/components/pages/WorkersPage";
import { ReportsPage } from "@/components/pages/ReportsPage";
import { SettingsPage } from "@/components/pages/SettingsPage";
import { useStore } from "@/store/useStore";

type Tab = "attendance" | "workers" | "reports" | "settings";

function AppSkeleton() {
  return (
    <div className="flex flex-col h-screen-safe animate-pulse">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="h-5 w-48 bg-gray-200 rounded" />
      </header>
      <div className="px-4 pt-4 mb-3">
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
      <div className="px-4 space-y-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-8 bg-gray-100 rounded" />
                  <div className="h-5 w-8 bg-gray-100 rounded" />
                  <div className="h-5 w-8 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-16 bg-white border-t border-gray-200 flex-shrink-0" />
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [hydrated, setHydrated] = useState(false);
  const isLoading = useStore((state) => state.isLoading);
  const isInitialized = useStore((state) => state.isInitialized);
  const isOffline = useStore((state) => state.isOffline);
  const workers = useStore((state) => state.workers);
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isInitialized) {
      initialize();
    }
  }, [hydrated, initialize, isInitialized]);

  if (!hydrated || isLoading) {
    return <AppSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen-safe">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="rounded-md" />
            <h1 className="text-lg font-semibold text-gray-900">
              Daily Wage Manager
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isOffline && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                Offline
              </span>
            )}
            <span className="text-sm text-gray-500">
              {workers.length} worker{workers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      {activeTab === "attendance" && <AttendancePage />}
      {activeTab === "workers" && <WorkersPage />}
      {activeTab === "reports" && <ReportsPage />}
      {activeTab === "settings" && <SettingsPage />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}