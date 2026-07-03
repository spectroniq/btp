'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Command, User, Settings, LogOut, ChevronRight, Briefcase, Flame, Mic } from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type AppNotification } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const typeIcon: Record<string, React.ElementType> = {
  jobs: Briefcase,
  streak: Flame,
  interview: Mic,
};

function NotificationItem({ n, onRead }: { n: AppNotification; onRead: (id: string) => void }) {
  const Icon = typeIcon[n.type] ?? Bell;
  return (
    <button
      onClick={() => !n.read && onRead(n.id)}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.read ? 'bg-white/5' : 'bg-[#1B6CF2]/15'}`}>
        <Icon size={13} className={n.read ? 'text-white/30' : 'text-[#1B6CF2]'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${n.read ? 'text-white/40' : 'text-white/80'}`}>{n.title}</p>
        <p className="text-white/30 text-xs mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
        <p className="text-white/20 text-xs mt-1">{relativeTime(n.createdAt)}</p>
      </div>
      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#1B6CF2] shrink-0 mt-1.5" />}
    </button>
  );
}

export default function Navbar() {
  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const queryClient = useQueryClient();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(notifRef, () => setNotifOpen(false));

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData<AppNotification[]>(['notifications'], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData<AppNotification[]>(['notifications'], (old = []) =>
        old.map((n) => ({ ...n, read: true })),
      );
    },
  });

  return (
    <header className="h-14 border-b border-white/5 bg-[#0D0D0F]/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-2 group focus-within:border-[#1B6CF2]/40 transition-all">
          <Search size={14} className="text-white/20 group-focus-within:text-[#1B6CF2] transition-colors shrink-0" />
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
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            className="relative w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1B6CF2]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-[#141418] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#1B6CF2]/20 text-[#1B6CF2] text-xs font-medium">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-[#1B6CF2] text-xs hover:text-[#1B6CF2]/70 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="py-8 flex flex-col items-center gap-2 text-center px-4">
                    <Bell size={22} className="text-white/15" />
                    <p className="text-white/30 text-sm">No notifications yet</p>
                    <p className="text-white/20 text-xs">We'll let you know when something happens</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem key={n.id} n={n} onRead={markRead} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* XP Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0A500]/10 border border-[#F0A500]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500]" />
          <span className="text-[#F0A500] text-xs font-medium">0 XP</span>
        </div>

        {/* Avatar + dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-[#F0A500]/30 transition-all"
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#F0A500]/20 flex items-center justify-center">
                <span className="text-[#F0A500] text-xs font-semibold">
                  {user?.firstName?.[0] ?? 'U'}
                </span>
              </div>
            )}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-10 w-60 bg-[#141418] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#F0A500]/20 flex items-center justify-center">
                        <span className="text-[#F0A500] text-sm font-semibold">
                          {user?.firstName?.[0] ?? 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {user?.fullName ?? user?.firstName ?? 'User'}
                    </p>
                    <p className="text-white/40 text-xs truncate">
                      {user?.primaryEmailAddress?.emailAddress ?? ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <User size={14} className="shrink-0" />
                  <span className="text-sm flex-1">Profile</span>
                  <ChevronRight size={12} className="text-white/20 group-hover:text-white/40 transition-colors" />
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <Settings size={14} className="shrink-0" />
                  <span className="text-sm flex-1">Settings</span>
                  <ChevronRight size={12} className="text-white/20 group-hover:text-white/40 transition-colors" />
                </Link>
              </div>

              <div className="border-t border-white/5 p-1.5">
                <button
                  onClick={() => signOut(() => router.push('/sign-in'))}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all"
                >
                  <LogOut size={14} className="shrink-0" />
                  <span className="text-sm">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
