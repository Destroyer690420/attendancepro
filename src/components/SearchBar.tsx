"use client";

import { Search, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState } from "react";

export function SearchBar() {
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="px-4 py-2">
      <div
        className={`flex items-center gap-2 bg-white border rounded-lg h-14 px-4 transition-colors ${
          isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"
        }`}
      >
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search workers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-base"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}