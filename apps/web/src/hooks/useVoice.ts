import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseVoiceReturn {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  startListening: (onFinal: (t: string) => void) => void;
  stopListening: () => void;
  speakChunk: (text: string, flush?: boolean) => void;
  speak: (text: string) => void;
  cancelSpeech: () => void;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const sentenceBufferRef = useRef('');
  const queueRef = useRef(0);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  const _enqueue = useCallback((text: string) => {
    const plain = stripMarkdown(text);
    if (!plain) return;
    const u = new SpeechSynthesisUtterance(plain);
    u.rate = 1.05;
    queueRef.current++;
    setIsSpeaking(true);
    const onDone = () => {
      queueRef.current = Math.max(0, queueRef.current - 1);
      if (queueRef.current === 0) setIsSpeaking(false);
    };
    u.onend = onDone;
    u.onerror = onDone;
    window.speechSynthesis.speak(u);
  }, []);

  // Called with each streaming chunk; speaks sentence-by-sentence as they complete.
  const speakChunk = useCallback(
    (text: string, flush = false) => {
      if (!isSupported) return;
      sentenceBufferRef.current += text;

      const re = /[^.!?]*[.!?]+(?:\s|$)/g;
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      while ((match = re.exec(sentenceBufferRef.current)) !== null) {
        _enqueue(match[0]);
        lastIndex = match.index + match[0].length;
      }
      sentenceBufferRef.current = sentenceBufferRef.current.slice(lastIndex);

      if (flush && sentenceBufferRef.current.trim()) {
        _enqueue(sentenceBufferRef.current);
        sentenceBufferRef.current = '';
      }
    },
    [isSupported, _enqueue],
  );

  // Speak a complete response at once (non-streaming).
  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;
      window.speechSynthesis.cancel();
      queueRef.current = 0;
      sentenceBufferRef.current = '';
      _enqueue(text);
    },
    [isSupported, _enqueue],
  );

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    queueRef.current = 0;
    sentenceBufferRef.current = '';
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(
    (onFinal: (t: string) => void) => {
      if (!isSupported) return;
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const r = new SR();
      r.continuous = false;
      r.interimResults = true;
      r.lang = 'en-US';

      r.onresult = (e: any) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        if (interim) setInterimTranscript(interim);
        if (final) {
          setInterimTranscript('');
          onFinal(final);
        }
      };
      r.onend = () => { setIsListening(false); setInterimTranscript(''); };
      r.onerror = () => { setIsListening(false); setInterimTranscript(''); };

      recognitionRef.current = r;
      r.start();
      setIsListening(true);
    },
    [isSupported],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { isSupported, isListening, isSpeaking, interimTranscript, startListening, stopListening, speakChunk, speak, cancelSpeech };
}
