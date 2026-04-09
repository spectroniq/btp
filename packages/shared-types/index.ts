// Shared types across BTP services

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  postedAt: Date;
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  xp: number;
  streak: number;
  level: number;
}

export interface DSAProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  description: string;
}