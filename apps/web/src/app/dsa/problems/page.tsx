'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Code2, Search, ChevronRight } from 'lucide-react';

const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays / HashMap',
    solved: false,
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    solved: false,
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    solved: false,
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    topic: 'Arrays / Sorting',
    solved: false,
  },
  {
    id: 'binary-tree-level-order',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    topic: 'Trees / BFS',
    solved: false,
  },
  {
    id: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    topic: 'Dynamic Programming',
    solved: false,
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    solved: false,
  },
  {
    id: 'word-break',
    title: 'Word Break',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    solved: false,
  },
  {
    id: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: 'Medium',
    topic: 'Graphs / DFS',
    solved: false,
  },
  {
    id: 'course-schedule',
    title: 'Course Schedule',
    difficulty: 'Medium',
    topic: 'Graphs / Topological Sort',
    solved: false,
  },
  {
    id: 'merge-k-sorted-lists',
    title: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    topic: 'Heap / Linked List',
    solved: false,
  },
  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    topic: 'Two Pointers',
    solved: false,
  },
];

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const TOPICS = [
  'All',
  'Arrays / HashMap',
  'Stack',
  'Sliding Window',
  'Trees / BFS',
  'Dynamic Programming',
  'Graphs / DFS',
  'Two Pointers',
  'Heap / Linked List',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F0A500',
  Hard: '#EF4444',
};

export default function DSAPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');

  const filtered = PROBLEMS.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchDiff = difficulty === 'All' || p.difficulty === difficulty;
    const matchTopic = topic === 'All' || p.topic === topic;
    return matchSearch && matchDiff && matchTopic;
  });

  const counts = {
    Easy: PROBLEMS.filter((p) => p.difficulty === 'Easy').length,
    Medium: PROBLEMS.filter((p) => p.difficulty === 'Medium').length,
    Hard: PROBLEMS.filter((p) => p.difficulty === 'Hard').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">DSA Lab</h1>
          <p className="text-white/40 text-sm mt-1">
            {PROBLEMS.length} problems · AI-powered reasoning coach
          </p>
        </div>
        <div className="flex gap-3">
          {Object.entries(counts).map(([diff, count]) => (
            <div key={diff} className="text-center">
              <p
                className="text-lg font-semibold"
                style={{ color: DIFFICULTY_COLORS[diff] }}
              >
                {count}
              </p>
              <p className="text-white/30 text-xs">{diff}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search size={14} className="text-white/20 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="bg-transparent text-white/70 text-sm placeholder:text-white/20 focus:outline-none w-full"
          />
        </div>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                difficulty === d
                  ? 'bg-[#1B6CF2] text-white'
                  : 'bg-white/5 text-white/40 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Topic filters */}
      <div className="flex gap-2 flex-wrap">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              topic === t
                ? 'bg-[#F0A500]/20 text-[#F0A500] border border-[#F0A500]/30'
                : 'bg-white/5 text-white/30 hover:text-white/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Problem List */}
      <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_6rem_8rem_2rem] gap-4 px-5 py-3 border-b border-white/5">
          <span className="text-white/20 text-xs">#</span>
          <span className="text-white/20 text-xs">Title</span>
          <span className="text-white/20 text-xs">Difficulty</span>
          <span className="text-white/20 text-xs">Topic</span>
          <span />
        </div>
        {filtered.map((p, i) => (
          <Link
            key={p.id}
            href={`/dsa/problems/${p.id}`}
            className="grid grid-cols-[2rem_1fr_6rem_8rem_2rem] gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors group items-center"
          >
            <span className="text-white/20 text-xs">{i + 1}</span>
            <div className="flex items-center gap-2">
              <Code2
                size={13}
                className="text-white/20 group-hover:text-[#1B6CF2] transition-colors shrink-0"
              />
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                {p.title}
              </span>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: DIFFICULTY_COLORS[p.difficulty] }}
            >
              {p.difficulty}
            </span>
            <span className="text-white/30 text-xs">{p.topic}</span>
            <ChevronRight
              size={14}
              className="text-white/10 group-hover:text-white/40 transition-colors"
            />
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-white/30 text-sm">
              No problems match your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
