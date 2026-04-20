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
} from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Job Hunt', icon: Briefcase },
  { href: '/dsa', label: 'DSA Lab', icon: Code2 },
  { href: '/references', label: 'References', icon: BookOpen },
  { href: '/interview', label: 'Mock Interview', icon: Mic },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#141418] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1B6CF2] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">BTP</p>
            <p className="text-white/40 text-xs">Big Tech Prep</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-[#1B6CF2]/10 text-[#1B6CF2] border border-[#1B6CF2]/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[#F0A500]/20 flex items-center justify-center">
            <span className="text-[#F0A500] text-xs font-semibold">K</span>
          </div>
          <div>
            <p className="text-white text-xs font-medium">Kingsley</p>
            <p className="text-white/30 text-xs">Level 1 · 0 XP</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
