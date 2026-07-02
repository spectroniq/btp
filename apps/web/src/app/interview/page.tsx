import Link from 'next/link';
import { Mic, Users, Cpu, ChevronRight } from 'lucide-react';

const MODES = [
  {
    href: '/interview/mock',
    icon: Mic,
    color: '#1B6CF2',
    label: 'Mock Interview',
    tagline: 'Practice with an AI coach',
    description:
      "The AI is on your side — it coaches, gives hints when you're stuck, and gives you feedback after each answer. Good for warming up and learning.",
    cta: 'Start practicing',
  },
  {
    href: '/interview/real',
    icon: Users,
    color: '#F0A500',
    label: 'Real Interview Simulation',
    tagline: 'The AI is the recruiter',
    description:
      'No coaching, no hints. The AI plays a real interviewer from Google, Meta, Amazon, Microsoft, or Apple. It presses you on vague answers and delivers a hiring verdict at the end.',
    cta: 'Pick a company',
  },
  {
    href: '/interview/ai-native',
    icon: Cpu,
    color: '#10B981',
    label: 'AI-Native Interview',
    tagline: 'AI use is allowed — how you use it is what matters',
    description:
      "Real-world engineering problems where using AI is expected. You're judged on speed, how well you prompt, whether you validate AI output, and how clearly you communicate.",
    cta: 'Choose a scenario',
  },
];

export default function InterviewLandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Mock Interviews</h1>
        <p className="text-white/40 text-sm mt-1">
          Three modes. Pick one based on where you are in your prep.
        </p>
      </div>

      <div className="grid gap-4">
        {MODES.map(({ href, icon: Icon, color, label, tagline, description, cta }) => (
          <Link
            key={href}
            href={href}
            className="bg-[#141418] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all group"
          >
            <div className="flex items-start gap-5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: color + '1A' }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-sm mt-0.5" style={{ color }}>{tagline}</p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-white/20 group-hover:text-white/50 transition-colors shrink-0"
                  />
                </div>
                <p className="text-white/40 text-sm mt-3 leading-relaxed">{description}</p>
                <span
                  className="inline-block mt-4 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{ backgroundColor: color + '1A', color }}
                >
                  {cta} →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
