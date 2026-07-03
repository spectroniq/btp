'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { referencesApi, type Reference } from '@/lib/api';

const CATEGORIES = ['DSA', 'System Design', 'Behavioral'];

export default function ReferencesPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['references', activeCategory],
    queryFn: () => referencesApi.getByCategory(activeCategory).then((r) => r.data),
  });

  const items: Reference[] = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">References</h1>
        <p className="text-white/40 text-sm mt-1">
          Quick reference cards for DSA, system design, and behavioral interviews.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setExpanded(null);
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-[#1B6CF2] text-white'
                : 'bg-[#141418] border border-white/5 text-white/50 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-[#1B6CF2] animate-spin" />
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">Could not load references. Make sure the gateway is running.</p>
        </div>
      )}

      {/* Cards */}
      {!isLoading && !isError && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === item.id ? null : item.id)
                }
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <BookOpen size={15} className="text-[#1B6CF2] shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <p className="text-white/30 text-xs mt-0.5">{item.when}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.complexity !== '—' && (
                    <span className="text-xs text-white/20 font-mono">
                      {item.complexity}
                    </span>
                  )}
                  {expanded === item.id ? (
                    <ChevronDown size={15} className="text-white/30" />
                  ) : (
                    <ChevronRight size={15} className="text-white/30" />
                  )}
                </div>
              </button>
              {expanded === item.id && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <p className="text-white/60 text-sm leading-relaxed">{item.summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
