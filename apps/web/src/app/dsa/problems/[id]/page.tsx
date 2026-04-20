'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels';
import dynamic from 'next/dynamic';
import { dsaApi } from '@/lib/api';
import {
  ChevronLeft,
  Send,
  Loader2,
  ChevronRight,
  Play,
  CheckCircle,
  XCircle,
  BotMessageSquare,
  X,
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1e1e1e] flex items-center justify-center">
      <Loader2 size={18} className="text-white/20 animate-spin" />
    </div>
  ),
});

const PROBLEMS: Record<
  string,
  {
    title: string;
    difficulty: string;
    topic: string;
    description: string;
    examples: { input: string; output: string; explanation?: string }[];
    constraints: string[];
    starterCode: string;
    testCases: { input: string; expected: string }[];
  }
> = {
  'two-sum': {
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays / HashMap',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9',
      },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    pass`,
    testCases: [
      { input: '[2,7,11,15], 9', expected: '[0,1]' },
      { input: '[3,2,4], 6', expected: '[1,2]' },
      { input: '[3,3], 6', expected: '[0,1]' },
    ],
  },
  'valid-parentheses': {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack',
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}"',
    ],
    starterCode: `def is_valid(s: str) -> bool:
    pass`,
    testCases: [
      { input: '"()"', expected: 'true' },
      { input: '"()[]{}"', expected: 'true' },
      { input: '"(]"', expected: 'false' },
    ],
  },
  'longest-substring': {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    description:
      'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with length 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with length 1.',
      },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    starterCode: `def length_of_longest_substring(s: str) -> int:
    pass`,
    testCases: [
      { input: '"abcabcbb"', expected: '3' },
      { input: '"bbbbb"', expected: '1' },
      { input: '"pwwkew"', expected: '3' },
    ],
  },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F0A500',
  Hard: '#EF4444',
};

type Message = { role: 'user' | 'assistant'; content: string };
type TestResult = {
  input: string;
  expected: string;
  status: 'pass' | 'fail' | 'pending';
};

export default function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const problem = PROBLEMS[id];

  const [code, setCode] = useState(problem?.starterCode ?? '');
  const [reasoning, setReasoning] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [coachOpen, setCoachOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'output'>('results');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/40">Problem not found.</p>
      </div>
    );
  }

  const handleRun = async () => {
    setRunning(true);
    setActiveTab('results');
    // Mock test runner — Judge0 integration later
    await new Promise((r) => setTimeout(r, 1200));
    setTestResults(
      problem.testCases.map((tc) => ({
        ...tc,
        status: Math.random() > 0.4 ? 'pass' : 'fail',
      }))
    );
    setRunning(false);
  };

  const handleSubmit = async () => {
    setRunning(true);
    setActiveTab('results');
    await new Promise((r) => setTimeout(r, 1800));
    setTestResults(problem.testCases.map((tc) => ({ ...tc, status: 'pass' })));
    setRunning(false);
  };

  const handleCoachSubmit = async () => {
    if (!reasoning.trim() || loading) return;
    const userMessage = reasoning.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setReasoning('');
    setLoading(true);
    try {
      const { data } = await dsaApi.reason({
        user_id: 'test-user',
        problem_id: id,
        problem_description: problem.description,
        user_reasoning: userMessage,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.coaching },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'AI engine unreachable.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] -m-8 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5 bg-[#0D0D0F] shrink-0">
        <button
          onClick={() => router.push('/dsa/problems')}
          className="flex items-center gap-1.5 text-white/30 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft size={15} />
          Problems
        </button>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-white/70 text-sm font-medium">
          {problem.title}
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            color: DIFFICULTY_COLORS[problem.difficulty],
            backgroundColor: DIFFICULTY_COLORS[problem.difficulty] + '1A',
          }}
        >
          {problem.difficulty}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCoachOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              coachOpen
                ? 'bg-[#1B6CF2]/10 text-[#1B6CF2] border border-[#1B6CF2]/20'
                : 'bg-white/5 text-white/30 border border-white/5 hover:text-white'
            }`}
          >
            <BotMessageSquare size={13} />
            AI Coach
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:text-white transition-all disabled:opacity-40"
          >
            {running ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Play size={13} />
            )}
            Run
          </button>
          <button
            onClick={handleSubmit}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] text-white text-xs hover:bg-[#10B981]/80 transition-all disabled:opacity-40"
          >
            <CheckCircle size={13} />
            Submit
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PanelGroup orientation="horizontal" className="h-full w-full">
          {/* Left panel */}
          <Panel defaultSize={'50%'} minSize={'30%'} maxSize={'70%'}>
            <PanelGroup orientation="vertical" className="h-full border-r border-white/5">
              {/* Problem description */}
              <Panel defaultSize={coachOpen ? '50%' : '100%'} minSize="20%">
                <div className="overflow-y-auto h-full p-5">
                  <p className="text-white/60 text-sm leading-relaxed">
                    {problem.description}
                  </p>
                  <div className="mt-5 space-y-3">
                    {problem.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="bg-white/3 border border-white/5 rounded-lg p-3 space-y-1"
                      >
                        <p className="text-white/20 text-xs font-medium">
                          Example {i + 1}
                        </p>
                        <p className="text-white/50 text-xs font-mono">
                          Input: {ex.input}
                        </p>
                        <p className="text-white/50 text-xs font-mono">
                          Output: {ex.output}
                        </p>
                        {ex.explanation && (
                          <p className="text-white/30 text-xs">
                            Explanation: {ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-white/20 text-xs font-medium mb-2">
                      Constraints
                    </p>
                    <ul className="space-y-1">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="text-white/30 text-xs font-mono">
                          · {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>

              {/* AI Coach */}
              {coachOpen && (
                <>
                  <PanelResizeHandle className="min-h-[4px] bg-white/5 hover:bg-[#1B6CF2]/40 transition-colors cursor-row-resize" />
                  <Panel defaultSize="50%" minSize="20%">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1B6CF2]/5 border-b border-[#1B6CF2]/10 shrink-0">
                        <div className="flex items-center gap-2">
                          <BotMessageSquare size={13} className="text-[#1B6CF2]" />
                          <span className="text-[#1B6CF2] text-xs font-medium">
                            AI Reasoning Coach
                          </span>
                        </div>
                        <button
                          onClick={() => setCoachOpen(false)}
                          className="text-white/20 hover:text-white/50 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                          <div className="py-8 text-center">
                            <p className="text-white/20 text-xs">
                              Share your reasoning.
                            </p>
                            <p className="text-white/10 text-xs mt-1">
                              The coach guides — never gives answers.
                            </p>
                          </div>
                        )}
                        {messages.map((m, i) => (
                          <div
                            key={i}
                            className={`flex gap-2 ${
                              m.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {m.role === 'assistant' && (
                              <div className="w-5 h-5 rounded bg-[#1B6CF2]/20 flex items-center justify-center shrink-0 mt-0.5">
                                <ChevronRight size={10} className="text-[#1B6CF2]" />
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                                m.role === 'user'
                                  ? 'bg-[#1B6CF2]/15 text-white/80 rounded-tr-sm'
                                  : 'bg-white/5 text-white/60 rounded-tl-sm'
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {loading && (
                          <div className="flex gap-2">
                            <div className="w-5 h-5 rounded bg-[#1B6CF2]/20 flex items-center justify-center shrink-0">
                              <Loader2 size={10} className="text-[#1B6CF2] animate-spin" />
                            </div>
                            <div className="bg-white/5 px-3 py-2 rounded-lg rounded-tl-sm">
                              <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="w-1 h-1 rounded-full bg-white/30 animate-bounce"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="p-3 border-t border-white/5 shrink-0">
                        <div className="flex gap-2">
                          <textarea
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCoachSubmit();
                              }
                            }}
                            placeholder="Explain your approach..."
                            className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-white/70 text-xs placeholder:text-white/20 resize-none focus:outline-none focus:border-[#1B6CF2]/40 transition-colors"
                            rows={2}
                          />
                          <button
                            onClick={handleCoachSubmit}
                            disabled={!reasoning.trim() || loading}
                            className="w-8 h-8 rounded-lg bg-[#1B6CF2] flex items-center justify-center self-end disabled:opacity-30 hover:bg-[#1B6CF2]/80 transition-colors shrink-0"
                          >
                            <Send size={13} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="min-w-[4px] bg-white/5 hover:bg-[#1B6CF2]/40 transition-colors cursor-col-resize" />

          {/* Right panel */}
          <Panel defaultSize={'50%'} minSize={'40%'}>
            <PanelGroup orientation="vertical" className="h-full">
              {/* Editor */}
              <Panel defaultSize={65} minSize={30}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#141418] shrink-0">
                    <span className="text-white/30 text-xs font-mono">
                      Python 3
                    </span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <MonacoEditor
                      height="100%"
                      language="python"
                      theme="vs-dark"
                      value={code}
                      onChange={(v) => setCode(v ?? '')}
                      options={{
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        fontFamily: 'JetBrains Mono, Fira Code, monospace',
                        padding: { top: 12 },
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
              </Panel>

              {/* Vertical resize handle */}
              <PanelResizeHandle className="min-h-[4px] bg-white/5 hover:bg-[#1B6CF2]/40 transition-colors cursor-row-resize" />

              {/* Results */}
              <Panel defaultSize={35} minSize={20}>
                <div className="flex flex-col h-full bg-[#141418]">
                  <div className="flex items-center gap-4 px-4 border-b border-white/5 shrink-0">
                    {(['results', 'output'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2.5 text-xs capitalize border-b-2 transition-all ${
                          activeTab === tab
                            ? 'border-[#1B6CF2] text-white'
                            : 'border-transparent text-white/30 hover:text-white/60'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'results' && (
                      <div className="space-y-2">
                        {running && (
                          <div className="flex items-center gap-2 text-white/30 text-xs">
                            <Loader2 size={12} className="animate-spin" />
                            Running test cases...
                          </div>
                        )}
                        {!running && testResults.length === 0 && (
                          <p className="text-white/20 text-xs">
                            Run your code to see results.
                          </p>
                        )}
                        {!running &&
                          testResults.map((r, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
                                r.status === 'pass'
                                  ? 'bg-[#10B981]/5 border border-[#10B981]/10'
                                  : 'bg-[#EF4444]/5 border border-[#EF4444]/10'
                              }`}
                            >
                              {r.status === 'pass' ? (
                                <CheckCircle
                                  size={13}
                                  className="text-[#10B981] shrink-0"
                                />
                              ) : (
                                <XCircle
                                  size={13}
                                  className="text-[#EF4444] shrink-0"
                                />
                              )}
                              <span className="text-white/40 font-mono">
                                Input: {r.input}
                              </span>
                              <span className="text-white/20">→</span>
                              <span className="text-white/40 font-mono">
                                Expected: {r.expected}
                              </span>
                              <span
                                className="ml-auto font-medium"
                                style={{
                                  color:
                                    r.status === 'pass' ? '#10B981' : '#EF4444',
                                }}
                              >
                                {r.status === 'pass' ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                    {activeTab === 'output' && (
                      <p className="text-white/20 text-xs font-mono">
                        Output will appear here. Judge0 integration coming soon.
                      </p>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
