import axios from 'axios';

export const gateway = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const aiEngine = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_ENGINE_URL + '/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Jobs
export const jobsApi = {
  getAll: () => gateway.get('/jobs'),
  save: (jobId: string) => gateway.post(`/jobs/${jobId}/save`),
  unsave: (jobId: string) => gateway.delete(`/jobs/${jobId}/save`),
  getSaved: () => gateway.get('/jobs/saved'),
  triggerScrape: () => gateway.post('/jobs/trigger-scrape'),
};

// DSA
export const dsaApi = {
  reason: (payload: {
    user_id: string;
    problem_id: string;
    problem_description: string;
    user_reasoning: string;
  }) => aiEngine.post('/dsa/reason', payload),
};

// Interview
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
