import axios from 'axios';

export const gateway = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const aiEngine = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_ENGINE_URL + '/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const setTokenGetter = (getToken: () => Promise<string | null>) => {
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

export const jobsApi = {
  getAll: () => gateway.get('/jobs'),
  save: (jobId: string) => gateway.post(`/jobs/${jobId}/save`),
  unsave: (jobId: string) => gateway.delete(`/jobs/${jobId}/save`),
  getSaved: () => gateway.get('/jobs/saved'),
  triggerScrape: () => gateway.post('/jobs/trigger-scrape'),
};

export const dsaApi = {
  reason: (payload: {
    user_id: string;
    problem_id: string;
    problem_description: string;
    user_reasoning: string;
  }) => aiEngine.post('/dsa/reason', payload),
};

export const interviewApi = {
  message: (payload: {
    user_id: string;
    stage: string;
    history: { role: string; content: string }[];
    message: string;
  }) => aiEngine.post('/interview/message', payload),
  feedback: (payload: {
    stage: string;
    transcript: { role: string; content: string }[];
  }) => aiEngine.post('/interview/feedback', payload),
};
