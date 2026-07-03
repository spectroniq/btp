'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { interviewApi, streamAiEngine } from '@/lib/api';
import companiesData from '../../../../data/interview-companies.json';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useVoice } from '@/hooks/useVoice';
import { ChevronLeft, ChevronRight, Send, Loader2, Users, Trophy, AlertCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

type Company = (typeof companiesData)[number];
type Stage = Company['stages'][number];
type Message = { role: 'user' | 'assistant'; content: string };
type Verdict = { verdict: string; strengths: string[]; concerns: string[]; assessment: string };

const VERDICT_COLORS: Record<string, string> = {
  'Strong Hire': '#10B981',
  'Hire': '#1B6CF2',
  'No Hire': '#F0A500',
  'Strong No Hire': '#EF4444',
};

type Screen = 'company' | 'stage' | 'interview' | 'verdict';

export default function RealInterviewPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [screen, setScreen] = useState<Screen>('company');
  const [company, setCompany] = useState<Company | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const { isSupported, isListening, isSpeaking, interimTranscript, startListening, stopListening, speakChunk, cancelSpeech } = useVoice();

  const pickCompany = (c: Company) => {
    setCompany(c);
    setScreen('stage');
  };

  const pickStage = async (s: Stage, voice = false) => {
    if (!company) return;
    setStage(s);
    setMessages([{ role: 'assistant', content: '' }]);
    setScreen('interview');
    setLoading(true);
    try {
      let text = '';
      for await (const chunk of streamAiEngine('/interview/real/message/stream', {
        user_id: userId ?? 'anonymous',
        persona: company.persona,
        stage_label: s.label,
        stage_focus: s.focus,
        company_name: company.name,
        history: [],
        message: 'Begin the interview. Introduce yourself briefly in one sentence, then ask your first question.',
      })) {
        text += chunk;
        setMessages([{ role: 'assistant', content: text }]);
        if (voice) speakChunk(chunk);
      }
      if (voice) speakChunk('', true);
    } catch {
      setMessages([{ role: 'assistant', content: 'Could not connect to the AI engine.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (voiceText?: string) => {
    const userMessage = (voiceText ?? input).trim();
    if (!userMessage || loading || !company || !stage) return;
    const snap = [...messages];
    const newHistory = [...snap, { role: 'user' as const, content: userMessage }];
    setMessages([...newHistory, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);
    try {
      let text = '';
      for await (const chunk of streamAiEngine('/interview/real/message/stream', {
        user_id: userId ?? 'anonymous',
        persona: company.persona,
        stage_label: stage.label,
        stage_focus: stage.focus,
        company_name: company.name,
        history: snap.map((m) => ({ role: m.role, content: m.content })),
        message: userMessage,
      })) {
        text += chunk;
        setMessages([...newHistory, { role: 'assistant', content: text }]);
        if (voiceText !== undefined) speakChunk(chunk);
      }
      if (voiceText !== undefined) speakChunk('', true);
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  const getVerdict = async () => {
    if (!company || !stage || messages.length === 0) return;
    setVerdictLoading(true);
    try {
      const { data } = await interviewApi.realVerdict({
        persona: company.persona,
        stage_label: stage.label,
        company_name: company.name,
        transcript: messages,
      });
      setVerdict(data);
      setScreen('verdict');
    } catch {
      setVerdict({ verdict: 'No Hire', strengths: [], concerns: ['Could not generate verdict.'], assessment: '' });
      setScreen('verdict');
    } finally {
      setVerdictLoading(false);
    }
  };

  // ── Company picker ──────────────────────────────────────
  if (screen === 'company') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/interview')} className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ChevronLeft size={15} /> Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div>
            <h1 className="text-2xl font-semibold text-white">Real Interview</h1>
            <p className="text-white/40 text-sm mt-1">Pick a company. The AI will play their interviewer.</p>
          </div>
        </div>
        <div className="grid gap-3">
          {companiesData.map((c) => (
            <button key={c.id} onClick={() => pickCompany(c as Company)}
              className="bg-[#141418] border border-white/5 rounded-xl p-5 text-left hover:border-white/10 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: c.color + '20', color: c.color }}>
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{c.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{c.description}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Stage picker ────────────────────────────────────────
  if (screen === 'stage' && company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('company')} className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ChevronLeft size={15} /> Companies
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: company.color + '20', color: company.color }}>
              {company.name[0]}
            </div>
            <span className="text-white text-sm font-medium">{company.name}</span>
          </div>
        </div>
        <div>
          <p className="text-white/40 text-sm mb-4">Choose the interview stage.</p>
          <div className="grid gap-3">
            {company.stages.map((s, i) => (
              <button key={s.id} onClick={() => pickStage(s)}
                className="bg-[#141418] border border-white/5 rounded-xl p-5 text-left hover:border-white/10 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 text-sm font-medium group-hover:bg-white/10 group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{s.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{s.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Verdict screen ──────────────────────────────────────
  if (screen === 'verdict' && verdict && company && stage) {
    const color = VERDICT_COLORS[verdict.verdict] ?? '#8B5CF6';
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('company')} className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ChevronLeft size={15} /> New Interview
          </button>
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{company.name} · {stage.label}</p>
              <p className="text-white text-lg font-semibold mt-1">Interview Complete</p>
            </div>
            <Trophy size={24} style={{ color }} />
          </div>

          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-bold"
              style={{ backgroundColor: color + '15', color }}>
              {verdict.verdict}
            </div>
          </div>

          {verdict.strengths.length > 0 && (
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Strengths</p>
              <ul className="space-y-1.5">
                {verdict.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-[#10B981] mt-0.5 shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verdict.concerns.length > 0 && (
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Concerns</p>
              <ul className="space-y-1.5">
                {verdict.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <AlertCircle size={14} className="text-[#F0A500] mt-0.5 shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verdict.assessment && (
            <div className="border-t border-white/5 pt-5">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Overall Assessment</p>
              <p className="text-white/70 text-sm leading-relaxed">{verdict.assessment}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Interview chat ──────────────────────────────────────
  if (!company || !stage) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('stage')} className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ChevronLeft size={15} /> Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Users size={14} style={{ color: company.color }} />
            <span className="text-white text-sm font-medium">{company.name} · {stage.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
          <span className="text-white/30 text-xs">Real interview — no hints</span>
          <button onClick={getVerdict} disabled={messages.length < 4 || verdictLoading}
            className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F0A500]/10 border border-[#F0A500]/20 text-[#F0A500] text-sm hover:bg-[#F0A500]/20 transition-all disabled:opacity-30">
            {verdictLoading ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
            Get Verdict
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#141418] border border-white/5 rounded-xl flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-white/20 animate-spin" />
            </div>
          )}
          {messages.filter((m) => m.role === 'user' || m.content !== '').map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                  style={{ backgroundColor: company.color + '20', color: company.color }}>
                  {company.name[0]}
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-white/8 text-white/90 rounded-tr-sm' : 'bg-white/5 text-white/70 rounded-tl-sm'
              }`}>
                {m.role === 'assistant' ? (
                  <MarkdownMessage content={m.content} className="text-sm text-white/70" />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && messages.at(-1)?.content === '' && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ backgroundColor: company.color + '20', color: company.color }}>
                {company.name[0]}
              </div>
              <div className="bg-white/5 px-4 py-3 rounded-xl rounded-tl-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-3">
            {voiceMode ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-1">
                {loading ? (
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Loader2 size={20} className="text-white/40 animate-spin" />
                  </div>
                ) : (
                  <button
                    onClick={() => isListening ? stopListening() : startListening((t) => sendMessage(t))}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isListening ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {isListening ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white/70" />}
                  </button>
                )}
                {interimTranscript && (
                  <p className="text-white/50 text-xs text-center max-w-[80%] italic">{interimTranscript}</p>
                )}
              </div>
            ) : (
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type your answer..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
                rows={2} />
            )}
            {!voiceMode && (
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center self-end disabled:opacity-30 hover:bg-white/15 transition-colors">
                <Send size={16} className="text-white/70" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-white/20 text-xs">{voiceMode ? (loading ? 'AI is speaking...' : isListening ? 'Listening...' : 'Tap mic to speak') : 'Enter to send · Shift+Enter for new line'}</p>
            <div className="flex items-center gap-2">
              {voiceMode && isSpeaking && (
                <button onClick={cancelSpeech} className="text-white/30 hover:text-white/60 transition-colors">
                  <VolumeX size={14} />
                </button>
              )}
              {isSupported && (
                <button onClick={() => { setVoiceMode((v) => !v); cancelSpeech(); stopListening(); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${voiceMode ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/30 hover:text-white/60'}`}>
                  <Volume2 size={12} />
                  Voice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
