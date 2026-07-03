'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { interviewApi, streamAiEngine } from '@/lib/api';
import scenariosData from '../../../../../data/interview-scenarios.json';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { ChevronLeft, Send, Loader2, Clock, Cpu, CheckCircle, ChevronRight, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#1e1e1e] flex items-center justify-center"><Loader2 size={16} className="text-white/20 animate-spin" /></div>,
});

type Scenario = (typeof scenariosData)[number];
type Message = { role: 'user' | 'assistant'; content: string };
type ScoreDimension = { score: number; feedback: string };
type EvalResult = {
  decomposition: ScoreDimension;
  ai_usage: ScoreDimension;
  validation: ScoreDimension;
  communication: ScoreDimension;
  speed: ScoreDimension;
  verdict: string;
  overall: string;
};

const VERDICT_COLORS: Record<string, string> = {
  'Strong Hire': '#10B981',
  'Hire': '#1B6CF2',
  'No Hire': '#F0A500',
  'Strong No Hire': '#EF4444',
};

const DIMENSION_LABELS: Record<keyof Omit<EvalResult, 'verdict' | 'overall'>, string> = {
  decomposition: 'Problem Decomposition',
  ai_usage: 'AI Usage Quality',
  validation: 'Output Validation',
  communication: 'Communication',
  speed: 'Speed & Efficiency',
};

function useTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return { elapsed, display: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` };
}

export default function AINativeSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useAuth();

  const scenario = scenariosData.find((s) => s.id === id) as Scenario | undefined;
  const [started, setStarted] = useState(false);
  const [assistHistory, setAssistHistory] = useState<Message[]>([]);
  const [assistInput, setAssistInput] = useState('');
  const [assistLoading, setAssistLoading] = useState(false);
  const [solution, setSolution] = useState(scenario?.code_context?.content ?? '');
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const { elapsed, display: timerDisplay } = useTimer(started && !evalResult);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const { isSupported, isListening, isSpeaking, interimTranscript, startListening, stopListening, speakChunk, cancelSpeech } = useVoice();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistHistory]);


  if (!scenario) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/40">Scenario not found.</p>
      </div>
    );
  }

  const hasCode = !!scenario.code_context;
  const isEvaluated = !!evalResult;

  const sendAssist = async (voiceText?: string) => {
    const userMessage = (voiceText ?? assistInput).trim();
    if (!userMessage || assistLoading) return;
    const snap = [...assistHistory];
    const newHistory = [...snap, { role: 'user' as const, content: userMessage }];
    setAssistHistory([...newHistory, { role: 'assistant', content: '' }]);
    setAssistInput('');
    setAssistLoading(true);
    if (!started) setStarted(true);
    try {
      let text = '';
      for await (const chunk of streamAiEngine('/interview/ai-native/assist/stream', {
        problem_title: scenario.title,
        problem_context: scenario.problem,
        history: snap.map((m) => ({ role: m.role, content: m.content })),
        message: userMessage,
      })) {
        text += chunk;
        setAssistHistory([...newHistory, { role: 'assistant', content: text }]);
        if (voiceText !== undefined) speakChunk(chunk);
      }
      if (voiceText !== undefined) speakChunk('', true);
    } catch {
      setAssistHistory([...newHistory, { role: 'assistant', content: 'AI assistant unreachable.' }]);
    } finally {
      setAssistLoading(false);
    }
  };

  const submitForEval = async () => {
    if (!solution.trim() && assistHistory.length === 0) return;
    setEvalLoading(true);
    try {
      const { data } = await interviewApi.aiNativeEvaluate({
        scenario_title: scenario.title,
        scenario_problem: scenario.problem,
        ai_conversation: assistHistory,
        solution,
        time_taken_minutes: Math.ceil(elapsed / 60),
      });
      setEvalResult(data);
    } catch {
      setEvalResult(null);
    } finally {
      setEvalLoading(false);
    }
  };

  // ── Scorecard ───────────────────────────────────────────
  if (isEvaluated && evalResult) {
    const verdictColor = VERDICT_COLORS[evalResult.verdict] ?? '#8B5CF6';
    const avgScore = Math.round(
      (evalResult.decomposition.score + evalResult.ai_usage.score + evalResult.validation.score +
       evalResult.communication.score + evalResult.speed.score) / 5
    );

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/interview/ai-native')} className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ChevronLeft size={15} /> Scenarios
          </button>
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{scenario.title}</p>
            <div className="flex items-center justify-between">
              <p className="text-white text-lg font-semibold">AI-Native Scorecard</p>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: verdictColor }}>{avgScore}/10</p>
                <p className="text-xs" style={{ color: verdictColor }}>{evalResult.verdict}</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map((key) => {
              const dim = evalResult[key];
              const pct = (dim.score / 10) * 100;
              return (
                <div key={key} className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-white/70 text-sm font-medium">{DIMENSION_LABELS[key]}</p>
                    <span className="text-white text-sm font-semibold">{dim.score}/10</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#10B981' : pct >= 50 ? '#F0A500' : '#EF4444' }} />
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">{dim.feedback}</p>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-white/5 bg-white/2">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Overall</p>
            <p className="text-white/70 text-sm leading-relaxed">{evalResult.overall}</p>
          </div>
        </div>

        <button onClick={() => router.push('/interview/ai-native')}
          className="text-white/40 text-sm hover:text-white transition-colors flex items-center gap-1">
          <ChevronRight size={14} /> Try another scenario
        </button>
      </div>
    );
  }

  // ── Session layout ──────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] -m-8 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5 bg-[#0D0D0F] shrink-0">
        <button onClick={() => router.push('/interview/ai-native')} className="flex items-center gap-1.5 text-white/30 hover:text-white text-sm transition-colors">
          <ChevronLeft size={15} /> Scenarios
        </button>
        <div className="w-px h-4 bg-white/10" />
        <Cpu size={14} className="text-[#10B981]" />
        <span className="text-white/70 text-sm font-medium">{scenario.title}</span>
        <div className="ml-auto flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-sm font-mono ${started ? 'text-white/60' : 'text-white/20'}`}>
            <Clock size={13} />
            {timerDisplay}
            <span className="text-white/20 text-xs">/ {scenario.time_limit_minutes}m</span>
          </div>
          <button onClick={submitForEval} disabled={evalLoading || (!solution.trim() && assistHistory.length === 0)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#10B981] text-white text-xs font-medium hover:bg-[#10B981]/80 transition-all disabled:opacity-30">
            {evalLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            Submit & Evaluate
          </button>
        </div>
      </div>

      {/* Main layout: problem | AI assistant | solution */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Problem statement */}
        <div className="w-[35%] border-r border-white/5 flex flex-col min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: '#10B981', backgroundColor: '#10B98120' }}>
                  {scenario.difficulty.charAt(0) + scenario.difficulty.slice(1).toLowerCase()}
                </span>
                <span className="text-white/20 text-xs flex items-center gap-1">
                  <Clock size={10} /> {scenario.time_limit_minutes} min
                </span>
              </div>
              <p className="text-[#10B981] text-xs font-medium mt-2">Context</p>
              <p className="text-white/50 text-xs leading-relaxed">{scenario.context}</p>
            </div>

            <div>
              <p className="text-white/60 text-xs font-medium mb-2">Problem</p>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{scenario.problem}</p>
            </div>

            {scenario.code_context && (
              <div>
                <p className="text-white/40 text-xs font-medium mb-2 font-mono">{scenario.code_context.filename}</p>
                <pre className="text-white/50 text-xs font-mono bg-white/3 border border-white/5 rounded-lg p-3 overflow-x-auto leading-relaxed">
                  {scenario.code_context.content}
                </pre>
              </div>
            )}

            <div className="bg-[#10B981]/5 border border-[#10B981]/10 rounded-lg p-3">
              <p className="text-[#10B981]/70 text-xs font-medium mb-1">Reminder</p>
              <p className="text-white/40 text-xs leading-relaxed">
                Use the AI assistant freely. You're scored on how well you use it, not whether you avoid it.
              </p>
            </div>
          </div>
        </div>

        {/* Right: AI assistant + solution */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* AI Assistant chat (top half) */}
          <div className="flex-1 border-b border-white/5 flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#10B981]/5 shrink-0">
              <Cpu size={13} className="text-[#10B981]" />
              <span className="text-[#10B981] text-xs font-medium">AI Assistant</span>
              <span className="text-white/20 text-xs ml-auto">Ask anything about the problem</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {assistHistory.length === 0 && (
                <div className="py-8 text-center space-y-1">
                  <p className="text-white/20 text-xs">Your AI assistant is ready.</p>
                  <p className="text-white/10 text-xs">Ask about approaches, syntax, concepts — anything.</p>
                </div>
              )}
              {assistHistory.filter((m) => m.role === 'user' || m.content !== '').map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-5 h-5 rounded bg-[#10B981]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Cpu size={10} className="text-[#10B981]" />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#10B981]/15 text-white/80 rounded-tr-sm'
                      : 'bg-white/5 text-white/60 rounded-tl-sm'
                  }`}>
                    {m.role === 'assistant' ? (
                      <MarkdownMessage content={m.content} className="text-xs text-white/60" />
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {assistLoading && assistHistory.at(-1)?.content === '' && (
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded bg-[#10B981]/20 flex items-center justify-center shrink-0">
                    <Loader2 size={10} className="text-[#10B981] animate-spin" />
                  </div>
                  <div className="bg-white/5 px-3 py-2 rounded-lg rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => <div key={i} className="w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
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
                    {assistLoading ? (
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Loader2 size={16} className="text-[#10B981] animate-spin" />
                      </div>
                    ) : (
                      <button
                        onClick={() => isListening ? stopListening() : startListening((t) => sendAssist(t))}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isListening ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.5)] scale-110' : 'bg-[#10B981] hover:bg-[#10B981]/80'
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
                  <textarea value={assistInput} onChange={(e) => setAssistInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAssist(); } }}
                    placeholder="Ask the AI assistant..."
                    className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-white/70 text-xs placeholder:text-white/20 resize-none focus:outline-none focus:border-[#10B981]/40 transition-colors"
                    rows={2} />
                )}
                {!voiceMode && (
                  <button onClick={() => sendAssist()} disabled={!assistInput.trim() || assistLoading}
                    className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center self-end disabled:opacity-30 hover:bg-[#10B981]/80 transition-colors shrink-0">
                    <Send size={13} className="text-white" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-white/20 text-xs">{voiceMode ? (assistLoading ? 'AI is speaking...' : isListening ? 'Listening...' : 'Tap mic to speak') : ''}</p>
                <div className="flex items-center gap-2">
                  {voiceMode && isSpeaking && (
                    <button onClick={cancelSpeech} className="text-white/30 hover:text-white/60 transition-colors">
                      <VolumeX size={12} />
                    </button>
                  )}
                  {isSupported && (
                    <button onClick={() => { setVoiceMode((v) => !v); cancelSpeech(); stopListening(); }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${voiceMode ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-white/5 text-white/30 hover:text-white/50'}`}>
                      <Volume2 size={11} />
                      Voice
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Solution editor (bottom half) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#141418] shrink-0">
              <span className="text-white/30 text-xs font-medium">Your Solution</span>
              {hasCode && (
                <span className="text-white/20 text-xs font-mono">{scenario.code_context?.language}</span>
              )}
            </div>
            {hasCode ? (
              <div className="flex-1 min-h-0">
                <MonacoEditor
                  height="100%"
                  language={scenario.code_context?.language ?? 'typescript'}
                  theme="vs-dark"
                  value={solution}
                  onChange={(v) => { setSolution(v ?? ''); if (!started) setStarted(true); }}
                  options={{
                    fontSize: 12,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    padding: { top: 8 },
                    automaticLayout: true,
                  }}
                />
              </div>
            ) : (
              <textarea
                value={solution}
                onChange={(e) => { setSolution(e.target.value); if (!started) setStarted(true); }}
                placeholder="Write your solution, design, or architecture here..."
                className="flex-1 bg-[#141418] text-white/70 text-sm p-4 resize-none focus:outline-none placeholder:text-white/15 font-mono leading-relaxed"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
