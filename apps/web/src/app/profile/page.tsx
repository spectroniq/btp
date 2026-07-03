'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { dsaApi, jobsApi } from '@/lib/api';
import { Code2, Briefcase, Mic, Flame, Mail, Calendar, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const { data: dsaStats } = useQuery({
    queryKey: ['dsa-stats'],
    queryFn: () => dsaApi.getStats().then((r) => r.data),
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.getAll().then((r) => r.data as unknown[]),
  });

  const joinedDate = user?.createdAt
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))
    : null;

  const stats = [
    { label: 'Problems Solved', value: dsaStats != null ? String(dsaStats.solved) : '—', icon: Code2, color: '#F0A500' },
    { label: 'Current Streak', value: dsaStats != null ? `${dsaStats.streak}d` : '—', icon: Flame, color: '#EF4444' },
    { label: 'Interviews Done', value: '—', icon: Mic, color: '#10B981' },
    { label: 'Jobs Tracked', value: jobs != null ? String(jobs.length) : '—', icon: Briefcase, color: '#1B6CF2' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="text-white/40 text-sm mt-1">Your account and progress overview</p>
      </div>

      {/* Identity card */}
      <div className="bg-[#141418] border border-white/5 rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#F0A500]/20 flex items-center justify-center">
                <span className="text-[#F0A500] text-2xl font-semibold">
                  {user?.firstName?.[0] ?? 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-white text-lg font-semibold truncate">
              {user?.fullName ?? user?.firstName ?? 'User'}
            </h2>
            {user?.primaryEmailAddress && (
              <div className="flex items-center gap-1.5 text-white/40 text-sm">
                <Mail size={13} />
                <span className="truncate">{user.primaryEmailAddress.emailAddress}</span>
              </div>
            )}
            {joinedDate && (
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Calendar size={12} />
                <span>Joined {joinedDate}</span>
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0A500]/10 border border-[#F0A500]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500]" />
            <span className="text-[#F0A500] text-xs font-medium">Level 1 · 0 XP</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Stats</h3>
        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#141418] border border-white/5 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '1A' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div>
        <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Account</h3>
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5">
          <p className="text-white/40 text-sm leading-relaxed">
            Account details are managed through your sign-in provider. To update your name or profile photo, make changes via your Google or GitHub account.
          </p>
        </div>
      </div>

      {/* Sign out */}
      <div>
        <button
          onClick={() => signOut(() => router.push('/sign-in'))}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-sm"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
