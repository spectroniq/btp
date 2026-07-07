'use client';

import { useState, useRef, useEffect } from 'react';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels';
import dynamic from 'next/dynamic';
import { dsaApi, streamAiEngine, type DSAProblemDetail } from '@/lib/api';
import { ChevronLeft, Send, Loader2, ChevronRight, Play, CheckCircle, XCircle, BotMessageSquare, X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1e1e1e] flex items-center justify-center">
      <Loader2 size={18} className="text-white/20 animate-spin" />
    </div>
  ),
});

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#10B981',
  MEDIUM: '#F0A500',
  HARD: '#EF4444',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
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
  const { userId } = useAuth();

  const [problem, setProblem] = useState<DSAProblemDetail | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [code, setCode] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [coachOpen, setCoachOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'output'>('results');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execStdout, setExecStdout] = useState<string>('');
  const [solved, setSolved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const coachAbortRef = useRef<AbortController | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const { isSupported, isListening, isSpeaking, interimTranscript, startListening, stopListening, speakChunk, cancelSpeech } = useVoice();

  useEffect(() => {
    dsaApi.getProblem(id)
      .then((res) => {
        setProblem(res.data);
        setCode(res.data.starterCode ?? '');
      })
      .catch(() => setFetchError(true));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => { coachAbortRef.current?.abort(); };
  }, []);

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/40">Problem not found.</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={18} className="text-white/20 animate-spin" />
      </div>
    );
  }

  const mapResults = (results: { pass: boolean; actual: string; expected: string; error?: string }[], testCases: typeof problem.testCases): TestResult[] =>
    results.map((r, i) => ({
      input: JSON.stringify(testCases[i]?.input),
      expected: r.expected ?? '—',
      status: r.pass ? 'pass' : 'fail',
    }));

  const handleRun = async () => {
    setRunning(true);
    setActiveTab('results');
    setExecError(null);
    setExecStdout('');
    setTestResults([]);
    try {
      const { data } = await dsaApi.execute({ code, testCases: problem.testCases.slice(0, 1) });
      setExecStdout(data.stdout ?? '');
      if (data.error) {
        setExecError(data.error);
        return;
      }
      setTestResults(mapResults(data.results, problem.testCases));
    } catch {
      setExecError('Execution service unreachable.');
      setExecStdout('');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setRunning(true);
    setSolved(false);
    setActiveTab('results');
    setExecError(null);
    setExecStdout('');
    setTestResults([]);
    try {
      const { data } = await dsaApi.execute({ code, testCases: problem.testCases });
      setExecStdout(data.stdout ?? '');
      if (data.error) {
        setExecError(data.error);
        return;
      }
      const results = mapResults(data.results, problem.testCases);
      setTestResults(results);
      const allPass = results.length > 0 && results.every((r) => r.status === 'pass');
      if (allPass && userId) {
        try {
          await dsaApi.solve({
            slug: problem.slug,
            title: problem.title,
            difficulty: problem.difficulty,
            topic: problem.topic,
            code,
          });
          setSolved(true);
        } catch {
          // solve record failed — tests still passed, don't surface as execution error
        }
      }
    } catch {
      setExecError('Execution service unreachable.');
      setExecStdout('');
    } finally {
      setRunning(false);
    }
  };

  const handleCoachSubmit = async (voiceText?: string) => {
    const userMessage = (voiceText ?? reasoning).trim();
    if (!userMessage || loading) return;

    coachAbortRef.current?.abort();
    const controller = new AbortController();
    coachAbortRef.current = controller;

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '' }]);
    setReasoning('');
    setLoading(true);
    try {
      let text = '';
      for await (const chunk of streamAiEngine('/dsa/reason/stream', {
        user_id: userId ?? 'anonymous',
        problem_id: problem.id,
        problem_description: problem.description,
        user_reasoning: userMessage,
        user_code: code,
      }, controller.signal)) {
        text += chunk;
        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: text }]);
        if (voiceText !== undefined) speakChunk(chunk);
      }
      if (voiceText !== undefined) speakChunk('', true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev.slice(0, -1),
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
          {DIFFICULTY_LABELS[problem.difficulty] ?? problem.difficulty}
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
                        <p className="text-white/50 text-xs font-mono whitespace-pre-wrap">
                          {ex}
                        </p>
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
                        {messages.filter((m) => m.role === 'user' || m.content !== '').map((m, i) => (
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
                              {m.role === 'assistant' ? (
                                <MarkdownMessage content={m.content} className="text-xs text-white/60" />
                              ) : (
                                m.content
                              )}
                            </div>
                          </div>
                        ))}
                        {loading && messages.at(-1)?.content === '' && (
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
                          {voiceMode ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1">
                              {loading ? (
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                  <Loader2 size={16} className="text-[#1B6CF2] animate-spin" />
                                </div>
                              ) : (
                                <button
                                  onClick={() => isListening ? stopListening() : startListening((t) => handleCoachSubmit(t))}
                                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                    isListening ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.5)] scale-110' : 'bg-[#1B6CF2] hover:bg-[#1B6CF2]/80'
                                  }`}
                                >
                                  {isListening ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-white" />}
                                </button>
                              )}
                              {interimTranscript && (
                                <p className="text-white/50 text-xs text-center italic">{interimTranscript}</p>
                              )}
                            </div>
                          ) : (
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
                          )}
                          {!voiceMode && (
                            <button
                              onClick={() => handleCoachSubmit()}
                              disabled={!reasoning.trim() || loading}
                              className="w-8 h-8 rounded-lg bg-[#1B6CF2] flex items-center justify-center self-end disabled:opacity-30 hover:bg-[#1B6CF2]/80 transition-colors shrink-0"
                            >
                              <Send size={13} className="text-white" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-white/20 text-xs">{voiceMode ? (loading ? 'AI is speaking...' : isListening ? 'Listening...' : 'Tap mic to speak') : ''}</p>
                          <div className="flex items-center gap-2">
                            {voiceMode && isSpeaking && (
                              <button onClick={cancelSpeech} className="text-white/30 hover:text-white/60 transition-colors">
                                <VolumeX size={12} />
                              </button>
                            )}
                            {isSupported && (
                              <button onClick={() => { setVoiceMode((v) => !v); cancelSpeech(); stopListening(); }}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${voiceMode ? 'bg-[#1B6CF2]/20 text-[#1B6CF2]' : 'bg-white/5 text-white/30 hover:text-white/50'}`}>
                                <Volume2 size={11} />
                                Voice
                              </button>
                            )}
                          </div>
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
                      onChange={(v) => { setCode(v ?? ''); setSolved(false); }}
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
                        {solved && !running && (
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                            <CheckCircle size={14} className="text-[#10B981] shrink-0" />
                            <span className="text-[#10B981] text-xs font-medium">Accepted — solution recorded!</span>
                          </div>
                        )}
                        {running && (
                          <div className="flex items-center gap-2 text-white/30 text-xs">
                            <Loader2 size={12} className="animate-spin" />
                            Running...
                          </div>
                        )}
                        {!running && execError && (
                          <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-lg p-3">
                            <p className="text-[#EF4444] text-xs font-mono whitespace-pre-wrap">{execError}</p>
                          </div>
                        )}
                        {!running && !execError && testResults.length === 0 && (
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
                      <pre className="text-white/70 text-xs font-mono whitespace-pre-wrap">
                        {execStdout || <span className="text-white/20">Run your code to see output.</span>}
                      </pre>
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
