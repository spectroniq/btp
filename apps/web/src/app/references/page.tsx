'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

const REFERENCES = {
  DSA: [
    {
      title: 'Two Pointers',
      complexity: 'O(n) time · O(1) space',
      when: 'Sorted arrays, palindromes, pair problems',
      summary:
        'Use two indices moving toward each other or in the same direction. Eliminates the need for nested loops on sorted data.',
    },
    {
      title: 'Sliding Window',
      complexity: 'O(n) time · O(k) space',
      when: 'Subarrays, substrings, fixed/variable window',
      summary:
        'Maintain a window of elements and expand/shrink as you traverse. Avoids recomputing overlapping subproblems.',
    },
    {
      title: 'Binary Search',
      complexity: 'O(log n) time · O(1) space',
      when: 'Sorted arrays, search space reduction, min/max problems',
      summary:
        'Halve the search space each iteration. Can be applied on the answer space, not just arrays.',
    },
    {
      title: 'BFS',
      complexity: 'O(V+E) time · O(V) space',
      when: 'Shortest path, level order traversal, graph exploration',
      summary:
        'Uses a queue. Explores nodes level by level. Always finds shortest path in unweighted graphs.',
    },
    {
      title: 'DFS',
      complexity: 'O(V+E) time · O(V) space',
      when: 'Connected components, cycle detection, topological sort',
      summary:
        'Uses recursion or stack. Goes deep before backtracking. Good for exhaustive search.',
    },
    {
      title: 'Dynamic Programming',
      complexity: 'Varies',
      when: 'Overlapping subproblems, optimal substructure',
      summary:
        'Break problem into subproblems, store results to avoid recomputation. Think: can I define this recursively? Can I cache?',
    },
  ],
  'System Design': [
    {
      title: 'Load Balancer',
      complexity: '—',
      when: 'Distributing traffic across servers',
      summary:
        'Routes requests to servers using algorithms like round robin, least connections, or IP hash. Prevents any single server from being overwhelmed.',
    },
    {
      title: 'Caching',
      complexity: '—',
      when: 'Reducing latency, reducing DB load',
      summary:
        'Store frequently accessed data in fast storage (Redis, Memcached). Consider: cache-aside, write-through, write-behind. Always think about invalidation.',
    },
    {
      title: 'Database Sharding',
      complexity: '—',
      when: 'Horizontal scaling of databases',
      summary:
        'Split data across multiple DB instances by a shard key. Enables horizontal scaling but complicates joins and transactions.',
    },
    {
      title: 'Message Queue',
      complexity: '—',
      when: 'Async processing, decoupling services',
      summary:
        'Services communicate via messages rather than direct calls. Enables retries, rate limiting, and decoupling. Examples: Kafka, RabbitMQ, Redis Pub/Sub.',
    },
    {
      title: 'CDN',
      complexity: '—',
      when: 'Static assets, global latency reduction',
      summary:
        'Cache static content at edge nodes close to users. Reduces origin server load and improves global latency significantly.',
    },
  ],
  Behavioral: [
    {
      title: 'STAR Framework',
      complexity: '—',
      when: 'All behavioral questions',
      summary:
        'Situation → Task → Action → Result. Keep Situation and Task brief. Spend most time on Action (what YOU did) and Result (quantified impact).',
    },
    {
      title: 'Leadership Signals',
      complexity: '—',
      when: '"Tell me about a time you led..."',
      summary:
        'Show initiative, influence without authority, and decision-making under ambiguity. Quantify team size and outcomes.',
    },
    {
      title: 'Conflict Resolution',
      complexity: '—',
      when: '"Tell me about a disagreement..."',
      summary:
        'Show empathy, data-driven reasoning, and positive outcomes. Never blame. Focus on how you aligned toward a shared goal.',
    },
    {
      title: 'Failure Stories',
      complexity: '—',
      when: '"Tell me about a mistake..."',
      summary:
        'Own it fully. Show what you learned and what changed after. Interviewers want self-awareness and growth mindset.',
    },
    {
      title: 'Why This Company',
      complexity: '—',
      when: 'Closing questions',
      summary:
        'Be specific — reference their products, engineering culture, or recent launches. Generic answers are a red flag.',
    },
  ],
};

type Category = keyof typeof REFERENCES;

export default function ReferencesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('DSA');
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">References</h1>
        <p className="text-white/40 text-sm mt-1">
          Quick reference cards for DSA, system design, and behavioral
          interviews.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {(Object.keys(REFERENCES) as Category[]).map((cat) => (
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

      {/* Cards */}
      <div className="space-y-2">
        {REFERENCES[activeCategory].map((item) => (
          <div
            key={item.title}
            className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden"
          >
            <button
              onClick={() =>
                setExpanded(expanded === item.title ? null : item.title)
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
                {expanded === item.title ? (
                  <ChevronDown size={15} className="text-white/30" />
                ) : (
                  <ChevronRight size={15} className="text-white/30" />
                )}
              </div>
            </button>
            {expanded === item.title && (
              <div className="px-5 pb-5 border-t border-white/5 pt-4">
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.summary}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
