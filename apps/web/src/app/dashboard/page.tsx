import { Briefcase, Code2, Mic, Flame } from 'lucide-react';

const stats = [
  { label: 'Jobs Found', value: '0', icon: Briefcase, color: '#1B6CF2' },
  { label: 'Problems Solved', value: '0', icon: Code2, color: '#F0A500' },
  { label: 'Interviews Done', value: '0', icon: Mic, color: '#10B981' },
  { label: 'Day Streak', value: '0', icon: Flame, color: '#EF4444' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good morning, Kingsley
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Let's get you closer to that offer.
        </p>
      </div>

      {/* Stats */}
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

      {/* Quick actions */}
      <div>
        <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Practice a DSA problem', href: '/dsa', color: '#F0A500' },
            {
              label: 'Start a mock interview',
              href: '/interview',
              color: '#1B6CF2',
            },
            { label: 'Browse new jobs', href: '/jobs', color: '#10B981' },
          ].map(({ label, href, color }) => (
            <a
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
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
