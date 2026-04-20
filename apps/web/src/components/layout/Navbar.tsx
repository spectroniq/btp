'use client';

import { useState } from 'react';
import { Search, Bell, Command } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function Navbar() {
  const [search, setSearch] = useState('');

  // Inside component
  const { user } = useUser();

  return (
    <header className="h-14 border-b border-white/5 bg-[#0D0D0F]/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-2 group focus-within:border-[#1B6CF2]/40 transition-all">
          <Search
            size={14}
            className="text-white/20 group-focus-within:text-[#1B6CF2] transition-colors shrink-0"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems, jobs, references..."
            className="flex-1 bg-transparent text-white/70 text-sm placeholder:text-white/20 focus:outline-none"
          />
          <div className="flex items-center gap-1 shrink-0">
            <Command size={11} className="text-white/15" />
            <span className="text-white/15 text-xs">K</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1B6CF2]" />
        </button>

        {/* XP Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0A500]/10 border border-[#F0A500]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500]" />
          <span className="text-[#F0A500] text-xs font-medium">0 XP</span>
        </div>

        {/* Avatar */}
        <button className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-[#F0A500]/30 transition-all">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#F0A500]/20 flex items-center justify-center">
              <span className="text-[#F0A500] text-xs font-semibold">
                {user?.firstName?.[0] ?? 'U'}
              </span>
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
