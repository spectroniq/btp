'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { dsaApi, jobsApi } from '@/lib/api';
import { Briefcase, Code2, Mic, Flame } from 'lucide-react';
import Link from 'next/link';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.username ?? 'there';

  const { data: dsaStats } = useQuery({
    queryKey: ['dsa-stats'],
    queryFn: () => dsaApi.getStats().then((r) => r.data),
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.getAll().then((r) => r.data as unknown[]),
  });

  const stats = [
    { label: 'Jobs Found', value: jobs != null ? String(jobs.length) : '—', icon: Briefcase, color: '#1B6CF2' },
    { label: 'Problems Solved', value: dsaStats != null ? String(dsaStats.solved) : '—', icon: Code2, color: '#F0A500' },
    { label: 'Interviews Done', value: '—', icon: Mic, color: '#10B981' },
    { label: 'Day Streak', value: dsaStats != null ? String(dsaStats.streak) : '—', icon: Flame, color: '#EF4444' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {greeting()}, {firstName}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Let's get you closer to that offer.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-[#141418] border border-white/5 rounded-xl p-5 space-y-3"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: color + '1A' }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{value}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Practice a DSA problem', href: '/dsa', color: '#F0A500' },
            { label: 'Start a mock interview', href: '/interview', color: '#1B6CF2' },
            { label: 'Browse new jobs', href: '/jobs', color: '#10B981' },
          ].map(({ label, href, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-[#141418] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
            >
              <div
                className="w-1.5 h-1.5 rounded-full mb-3"
                style={{ backgroundColor: color }}
              />
              <p className="text-white/70 text-sm group-hover:text-white transition-colors">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
