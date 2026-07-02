import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Tag } from 'lucide-react';
import scenariosData from '../../../../data/interview-scenarios.json';

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#10B981',
  MEDIUM: '#F0A500',
  HARD: '#EF4444',
};

export default function AINativePickerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/interview" className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
          <ChevronLeft size={15} /> Back
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <div>
          <h1 className="text-2xl font-semibold text-white">AI-Native Interview</h1>
          <p className="text-white/40 text-sm mt-1">
            Real-world problems. AI use is allowed — your prompting and validation skills are what's being scored.
          </p>
        </div>
      </div>

      <div className="bg-[#10B981]/5 border border-[#10B981]/15 rounded-xl px-5 py-4 text-sm text-[#10B981]/80 leading-relaxed">
        You have a built-in AI assistant during each session. The evaluator watches how you use it — not just what you produce, but how precisely you prompt, whether you verify the output, and how clearly you communicate your thinking.
      </div>

      <div className="grid gap-4">
        {scenariosData.map((s) => (
          <Link key={s.id} href={`/interview/ai-native/${s.id}`}
            className="bg-[#141418] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium" style={{ color: DIFFICULTY_COLORS[s.difficulty] }}>
                    {s.difficulty.charAt(0) + s.difficulty.slice(1).toLowerCase()}
                  </span>
                  <span className="text-white/10">·</span>
                  <span className="text-white/30 text-xs flex items-center gap-1">
                    <Clock size={11} /> {s.time_limit_minutes} min
                  </span>
                </div>
                <p className="text-white font-medium text-sm group-hover:text-white/90">{s.title}</p>
                <p className="text-white/40 text-xs mt-1.5 leading-relaxed line-clamp-2">{s.context}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {s.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/30 flex items-center gap-1">
                      <Tag size={9} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors mt-1 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
