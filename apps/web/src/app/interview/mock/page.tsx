'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { interviewApi, streamAiEngine } from '@/lib/api';
import { Mic, Send, Loader2, ChevronRight, Award, ChevronLeft } from 'lucide-react';

const STAGES = [
  { id: 'BEHAVIORAL', label: 'Behavioral', description: 'Leadership, teamwork, conflict resolution' },
  { id: 'TECHNICAL_SCREEN', label: 'Technical Screen', description: 'CS fundamentals, problem solving' },
  { id: 'DSA_LIVE', label: 'DSA Live', description: 'Coding problem with live feedback' },
  { id: 'SYSTEM_DESIGN', label: 'System Design', description: 'Architecture and scalability' },
  { id: 'OFFER_DEBRIEF', label: 'Offer Debrief', description: 'Negotiation and questions to ask' },
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function MockInterviewPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [stage, setStage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startStage = async (stageId: string) => {
    setStage(stageId);
    setMessages([]);
    setFeedback(null);
    setLoading(true);
    const initMsg = { role: 'assistant' as const, content: '' };
    setMessages([initMsg]);
    try {
      let text = '';
      for await (const chunk of streamAiEngine('/interview/message/stream', {
        user_id: userId ?? 'anonymous',
        stage: stageId,
        history: [],
        message: 'Start the interview. Introduce yourself briefly and ask your first question.',
      })) {
        text += chunk;
        setMessages([{ role: 'assistant', content: text }]);
      }
    } catch {
      setMessages([{ role: 'assistant', content: 'Could not start interview. Check that the AI engine is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !stage) return;
    const userMessage = input.trim();
    const newHistory = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages([...newHistory, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);
    try {
      let text = '';
      for await (const chunk of streamAiEngine('/interview/message/stream', {
        user_id: userId ?? 'anonymous',
        stage,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        message: userMessage,
      })) {
        text += chunk;
        setMessages([...newHistory, { role: 'assistant', content: text }]);
      }
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  const getFeedback = async () => {
    if (!stage || messages.length === 0) return;
    setFeedbackLoading(true);
    try {
      const { data } = await interviewApi.feedback({ stage, transcript: messages });
      setFeedback(data.feedback);
    } catch {
      setFeedback('Could not generate feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!stage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/interview')} className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ChevronLeft size={15} /> Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div>
            <h1 className="text-2xl font-semibold text-white">Mock Interview</h1>
            <p className="text-white/40 text-sm mt-1">AI coaches you through each stage. Choose a stage to begin.</p>
          </div>
        </div>
        <div className="grid gap-3">
          {STAGES.map((s, i) => (
            <button key={s.id} onClick={() => startStage(s.id)}
              className="bg-[#141418] border border-white/5 rounded-xl p-5 text-left hover:border-[#1B6CF2]/30 hover:bg-[#1B6CF2]/5 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 text-sm font-medium group-hover:bg-[#1B6CF2]/10 group-hover:text-[#1B6CF2] transition-all">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{s.label}</p>
                    <p className="text-white/40 text-xs mt-0.5">{s.description}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20 group-hover:text-[#1B6CF2] transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentStage = STAGES.find((s) => s.id === stage)!;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setStage(null)} className="text-white/30 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ChevronLeft size={15} /> Stages
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Mic size={15} className="text-[#1B6CF2]" />
            <span className="text-white text-sm font-medium">{currentStage.label}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={getFeedback} disabled={messages.length === 0 || feedbackLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F0A500]/10 border border-[#F0A500]/20 text-[#F0A500] text-sm hover:bg-[#F0A500]/20 transition-all disabled:opacity-30">
            {feedbackLoading ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
            Get Feedback
          </button>
          <button onClick={() => startStage(stage)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white transition-all">
            Restart
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-[#F0A500]/5 border border-[#F0A500]/20 rounded-xl p-5 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Award size={15} className="text-[#F0A500]" />
            <span className="text-[#F0A500] text-sm font-medium">Session Feedback</span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{feedback}</p>
        </div>
      )}

      <div className="flex-1 bg-[#141418] border border-white/5 rounded-xl flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-[#1B6CF2] animate-spin" />
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#1B6CF2]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic size={13} className="text-[#1B6CF2]" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-[#1B6CF2]/20 text-white/90 rounded-tr-sm' : 'bg-white/5 text-white/70 rounded-tl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && messages.length > 0 && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#1B6CF2]/20 flex items-center justify-center shrink-0">
                <Loader2 size={13} className="text-[#1B6CF2] animate-spin" />
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
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your answer..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-[#1B6CF2]/50 transition-colors"
              rows={2} />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#1B6CF2] flex items-center justify-center self-end disabled:opacity-30 hover:bg-[#1B6CF2]/80 transition-colors">
              <Send size={16} className="text-white" />
            </button>
          </div>
          <p className="text-white/20 text-xs mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
