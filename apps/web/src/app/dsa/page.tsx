import Link from 'next/link';
import {
  Code2,
  ChevronRight,
  Flame,
  Target,
  Trophy,
  TrendingUp,
} from 'lucide-react';

const SUGGESTED = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays / HashMap',
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Sliding Window',
  },
];

const TOPICS = [
  { name: 'Arrays / HashMap', count: 15, solved: 0, color: '#1B6CF2' },
  { name: 'Sliding Window', count: 8, solved: 0, color: '#F0A500' },
  { name: 'Trees / BFS', count: 12, solved: 0, color: '#10B981' },
  { name: 'Dynamic Programming', count: 14, solved: 0, color: '#EF4444' },
  { name: 'Graphs / DFS', count: 10, solved: 0, color: '#8B5CF6' },
  { name: 'Two Pointers', count: 9, solved: 0, color: '#EC4899' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F0A500',
  Hard: '#EF4444',
};

const stats = [
  { label: 'Solved', value: '0', icon: Trophy, color: '#F0A500' },
  { label: 'Day Streak', value: '0', icon: Flame, color: '#EF4444' },
  { label: 'Attempts', value: '0', icon: Target, color: '#1B6CF2' },
  { label: 'Patterns Learned', value: '0', icon: TrendingUp, color: '#10B981' },
];

export default function DSADashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">DSA Lab</h1>
          <p className="text-white/40 text-sm mt-1">
            Track your progress and sharpen your problem-solving instincts.
          </p>
        </div>
        <Link
          href="/dsa/problems"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B6CF2] text-white text-sm hover:bg-[#1B6CF2]/80 transition-colors"
        >
          <Code2 size={15} />
          Browse Problems
        </Link>
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

      {/* Topic Progress */}
      <div>
        <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
          Topics
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TOPICS.map((t) => (
            <Link
              key={t.name}
              href={`/dsa/problems?topic=${encodeURIComponent(t.name)}`}
              className="bg-[#141418] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                  {t.name}
                </span>
                <span className="text-white/20 text-xs">
                  {t.solved}/{t.count}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(t.solved / t.count) * 100}%`,
                    backgroundColor: t.color,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Suggested Problems */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">
            Suggested for You
          </h2>
          <Link
            href="/dsa/problems"
            className="text-white/30 text-xs hover:text-white transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {SUGGESTED.map((p) => (
            <Link
              key={p.id}
              href={`/dsa/problems/${p.id}`}
              className="flex items-center gap-4 bg-[#141418] border border-white/5 rounded-xl px-5 py-4 hover:border-white/10 transition-all group"
            >
              <Code2
                size={15}
                className="text-white/20 group-hover:text-[#1B6CF2] transition-colors shrink-0"
              />
              <span className="text-white/70 text-sm flex-1 group-hover:text-white transition-colors">
                {p.title}
              </span>
              <span
                className="text-xs"
                style={{ color: DIFFICULTY_COLORS[p.difficulty] }}
              >
                {p.difficulty}
              </span>
              <span className="text-white/20 text-xs">{p.topic}</span>
              <ChevronRight
                size={14}
                className="text-white/10 group-hover:text-white/40 transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
