'use client';

import { useState } from 'react';
import { dsaApi } from '@/lib/api';
import { Code2, Send, Loader2, ChevronRight } from 'lucide-react';

const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays / HashMap',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    description:
      'Given a string s, find the length of the longest substring without repeating characters.',
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    topic: 'Arrays / Sorting',
    description:
      'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.',
  },
  {
    id: 'binary-tree-level-order',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    topic: 'Trees / BFS',
    description:
      'Given the root of a binary tree, return the level order traversal of its nodes values.',
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F0A500',
  Hard: '#EF4444',
};

type Message = { role: 'user' | 'assistant'; content: string };

export default function DSALabPage() {
  const [selected, setSelected] = useState(PROBLEMS[0]);
  const [reasoning, setReasoning] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reasoning.trim() || loading) return;

    const userMessage = reasoning.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setReasoning('');
    setLoading(true);

    try {
      const { data } = await dsaApi.reason({
        user_id: 'test-user',
        problem_id: selected.id,
        problem_description: selected.description,
        user_reasoning: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.coaching },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Check that the AI engine is running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-64px)]">
      {/* Problem List */}
      <div className="w-72 shrink-0 space-y-2 overflow-y-auto pr-1">
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-4">
          Problems
        </h2>
        {PROBLEMS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelected(p);
              setMessages([]);
            }}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selected.id === p.id
                ? 'bg-[#1B6CF2]/10 border-[#1B6CF2]/30'
                : 'bg-[#141418] border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-medium"
                style={{ color: DIFFICULTY_COLORS[p.difficulty] }}
              >
                {p.difficulty}
              </span>
              <span className="text-white/20 text-xs">{p.topic}</span>
            </div>
            <p className="text-white/80 text-sm font-medium leading-snug">
              {p.title}
            </p>
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Problem Description */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-6 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <Code2 size={16} className="text-[#1B6CF2]" />
            <h1 className="text-white font-semibold">{selected.title}</h1>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                color: DIFFICULTY_COLORS[selected.difficulty],
                backgroundColor: DIFFICULTY_COLORS[selected.difficulty] + '1A',
              }}
            >
              {selected.difficulty}
            </span>
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            {selected.description}
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#141418] border border-white/5 rounded-xl flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#1B6CF2]/10 flex items-center justify-center mb-4">
                  <Code2 size={22} className="text-[#1B6CF2]" />
                </div>
                <p className="text-white/40 text-sm">
                  Share your reasoning and the AI coach will guide you.
                </p>
                <p className="text-white/20 text-xs mt-1">
                  It won't give you the answer — it'll help you find it.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#1B6CF2]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ChevronRight size={14} className="text-[#1B6CF2]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#1B6CF2]/20 text-white/90 rounded-tr-sm'
                      : 'bg-white/5 text-white/70 rounded-tl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1B6CF2]/20 flex items-center justify-center shrink-0">
                  <Loader2 size={14} className="text-[#1B6CF2] animate-spin" />
                </div>
                <div className="bg-white/5 px-4 py-3 rounded-xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-3">
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Share your reasoning... how are you thinking about this problem?"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-[#1B6CF2]/50 transition-colors"
                rows={2}
              />
              <button
                onClick={handleSubmit}
                disabled={!reasoning.trim() || loading}
                className="w-10 h-10 rounded-xl bg-[#1B6CF2] flex items-center justify-center self-end disabled:opacity-30 hover:bg-[#1B6CF2]/80 transition-colors"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
            <p className="text-white/20 text-xs mt-2">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
