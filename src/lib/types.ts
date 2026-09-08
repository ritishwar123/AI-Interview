export type InterviewType = "behavioral" | "technical" | "system-design" | "mixed";

export type Persona = "hr" | "hiring-manager" | "tech-lead";

export interface JobPosting {
  id: string;
  companyName: string;
  role: string;
  jobDescription: string;
  interviewType: InterviewType;
  persona: Persona;
  durationMinutes: number;
  createdAt: number;
}

export interface ParsedResume {
  rawText: string;
  fileName: string;
  summary?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  projects?: string[];
}

export interface CandidateApplication {
  fullName: string;
  email: string;
  resume: ParsedResume;
}

export interface InterviewConfig {
  job: JobPosting;
  candidate: CandidateApplication;
}

export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export type HiringRecommendation = "strong-hire" | "hire" | "maybe" | "no-hire";

export interface HiringEvaluation {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  resumeAlignmentScore: number;
  recommendation: HiringRecommendation;
  strengths: string[];
  concerns: string[];
  resumeVerification: string[];
  summary: string;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  transcript: TranscriptEntry[];
  startedAt: number;
  endedAt?: number;
  evaluation?: HiringEvaluation;
  evaluationError?: string;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "listening"
  | "error"
  | "ended";
