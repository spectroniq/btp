import axios from 'axios';

export const gateway = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const aiEngine = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_ENGINE_URL + '/v1',
  headers: { 'Content-Type': 'application/json' },
});

let _tokenGetter: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getToken: () => Promise<string | null>) => {
  _tokenGetter = getToken;
  const interceptor = async (
    config: import('axios').InternalAxiosRequestConfig
  ) => {
    const token = await getToken();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  };
  gateway.interceptors.request.use(interceptor);
  aiEngine.interceptors.request.use(interceptor);
};

export async function* streamAiEngine(
  endpoint: string,
  payload: unknown,
): AsyncGenerator<string> {
  const token = _tokenGetter ? await _tokenGetter() : null;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_AI_ENGINE_URL}/v1${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok || !res.body) throw new Error(`AI engine error: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data) as { text?: string };
        if (parsed.text) yield parsed.text;
      } catch {}
    }
  }
}

// kept for backwards compat
export const setAuthToken = (token: string | null) => {
  if (token) {
    gateway.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    aiEngine.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete gateway.defaults.headers.common['Authorization'];
    delete aiEngine.defaults.headers.common['Authorization'];
  }
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export const notificationsApi = {
  getAll: () => gateway.get<AppNotification[]>('/notifications'),
  markRead: (id: string) => gateway.patch(`/notifications/${id}/read`),
  markAllRead: () => gateway.patch('/notifications/read-all'),
};

export type Reference = {
  id: string;
  category: string;
  title: string;
  complexity: string;
  when: string;
  summary: string;
  order: number;
};

export const referencesApi = {
  getAll: () => gateway.get<Reference[]>('/references'),
  getByCategory: (category: string) =>
    gateway.get<Reference[]>(`/references?category=${encodeURIComponent(category)}`),
};

export const jobsApi = {
  getAll: () => gateway.get('/jobs'),
  save: (jobId: string) => gateway.post(`/jobs/${jobId}/save`),
  unsave: (jobId: string) => gateway.delete(`/jobs/${jobId}/save`),
  getSaved: () => gateway.get('/jobs/saved'),
  triggerScrape: () => gateway.post('/jobs/trigger-scrape'),
};

export type DSAProblemSummary = {
  id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string;
};

export type DSAProblemDetail = DSAProblemSummary & {
  description: string;
  examples: string[];
  constraints: string[];
  starterCode: string;
  testCases: { input: unknown; expected: unknown }[];
};

export const dsaApi = {
  getProblems: () => gateway.get<DSAProblemSummary[]>('/dsa/problems'),
  getProblem: (slug: string) => gateway.get<DSAProblemDetail>(`/dsa/problems/${slug}`),

  reason: (payload: {
    user_id: string;
    problem_id: string;
    problem_description: string;
    user_reasoning: string;
  }) => aiEngine.post('/dsa/reason', payload),

  getStats: () => gateway.get<{ solved: number; attempts: number; streak: number; patternsLearned: number }>('/dsa/stats'),

  execute: (payload: {
    code: string;
    testCases: { input: unknown; expected: unknown }[];
  }) =>
    gateway.post<{
      results: { pass: boolean; actual: string; expected: string; error?: string }[];
      error?: string;
    }>('/dsa/execute', payload),

  solve: (payload: {
    slug: string;
    title: string;
    difficulty: string;
    topic: string;
    code: string;
  }) => gateway.post('/dsa/solve', payload),
};

type ChatMessage = { role: string; content: string };

export const interviewApi = {
  // Mock
  message: (payload: { user_id: string; stage: string; history: ChatMessage[]; message: string }) =>
    aiEngine.post<{ response: string; stage: string }>('/interview/message', payload),
  feedback: (payload: { stage: string; transcript: ChatMessage[] }) =>
    aiEngine.post<{ feedback: string }>('/interview/feedback', payload),

  // Real interview
  realMessage: (payload: {
    user_id: string;
    persona: string;
    stage_label: string;
    stage_focus: string;
    company_name: string;
    history: ChatMessage[];
    message: string;
  }) => aiEngine.post<{ response: string }>('/interview/real/message', payload),

  realVerdict: (payload: {
    persona: string;
    stage_label: string;
    company_name: string;
    transcript: ChatMessage[];
  }) =>
    aiEngine.post<{
      verdict: string;
      strengths: string[];
      concerns: string[];
      assessment: string;
    }>('/interview/real/verdict', payload),

  // AI-Native
  aiNativeAssist: (payload: {
    problem_title: string;
    problem_context: string;
    history: ChatMessage[];
    message: string;
  }) => aiEngine.post<{ response: string }>('/interview/ai-native/assist', payload),

  aiNativeEvaluate: (payload: {
    scenario_title: string;
    scenario_problem: string;
    ai_conversation: ChatMessage[];
    solution: string;
    time_taken_minutes: number;
  }) =>
    aiEngine.post<{
      decomposition: { score: number; feedback: string };
      ai_usage: { score: number; feedback: string };
      validation: { score: number; feedback: string };
      communication: { score: number; feedback: string };
      speed: { score: number; feedback: string };
      verdict: string;
      overall: string;
    }>('/interview/ai-native/evaluate', payload),
};
