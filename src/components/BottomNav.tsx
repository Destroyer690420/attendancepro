"use client";

import { Home, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "attendance" | "workers" | "reports" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "attendance", label: "Attendance", icon: Home },
  { id: "workers", label: "Workers", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors touch-manipulation",
                isActive ? "text-blue-600" : "text-gray-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}