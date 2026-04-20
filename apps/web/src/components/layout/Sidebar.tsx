'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Code2,
  BookOpen,
  Mic,
  LayoutDashboard,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useUser, useClerk } from '@clerk/nextjs';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Job Hunt', icon: Briefcase },
  { href: '/dsa', label: 'DSA Lab', icon: Code2 },
  { href: '/references', label: 'References', icon: BookOpen },
  { href: '/interview', label: 'Mock Interview', icon: Mic },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Inside the component
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#141418] border-r border-white/5 flex flex-col transition-all duration-300 z-50 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div
        className={`p-4 border-b border-white/5 flex items-center ${
          sidebarOpen ? 'justify-between' : 'justify-center'
        }`}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B6CF2] flex items-center justify-center shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">BTP</p>
              <p className="text-white/40 text-xs">Big Tech Prep</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 rounded-lg bg-[#1B6CF2] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={`w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all ${
            !sidebarOpen ? 'hidden' : ''
          }`}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={!sidebarOpen ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                sidebarOpen ? '' : 'justify-center'
              } ${
                active
                  ? 'bg-[#1B6CF2]/10 text-[#1B6CF2] border border-[#1B6CF2]/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={17} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mb-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Footer */}
      {sidebarOpen && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#F0A500]/20 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-[#F0A500] text-xs font-semibold">
                    {user?.firstName?.[0] ?? 'U'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-white text-xs font-medium">
                  {user?.firstName ?? 'User'}
                </p>
                <p className="text-white/30 text-xs">Level 1 · 0 XP</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-white/20 hover:text-white/50 transition-colors text-xs"
            >
              Out
            </button>
          </div>
        </div>
      )}

      {!sidebarOpen && (
        <div className="p-3 border-t border-white/5 flex justify-center">
          <div className="w-7 h-7 rounded-full bg-[#F0A500]/20 flex items-center justify-center overflow-hidden">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-[#F0A500] text-xs font-semibold">
                {user?.firstName?.[0] ?? 'U'}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
