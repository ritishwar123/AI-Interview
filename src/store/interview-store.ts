import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ConnectionStatus,
  HiringEvaluation,
  InterviewConfig,
  InterviewSession,
  TranscriptEntry,
} from "@/lib/types";

interface InterviewStore {
  config: InterviewConfig | null;
  session: InterviewSession | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
  elapsedSeconds: number;

  setConfig: (config: InterviewConfig) => void;
  startSession: (session: InterviewSession) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  updateTranscriptEntry: (id: string, text: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  setElapsedSeconds: (seconds: number) => void;
  setEvaluation: (evaluation: HiringEvaluation) => void;
  setEvaluationError: (error: string | null) => void;
  endSession: () => void;
  reset: () => void;
}

function isValidConfig(config: unknown): config is InterviewConfig {
  if (!config || typeof config !== "object") return false;
  const c = config as InterviewConfig;
  return Boolean(
    c.job?.companyName &&
      c.job?.role &&
      c.job?.jobDescription &&
      c.candidate?.fullName &&
      c.candidate?.email &&
      c.candidate?.resume?.rawText
  );
}

function isValidSession(session: unknown): session is InterviewSession {
  if (!session || typeof session !== "object") return false;
  const s = session as InterviewSession;
  return isValidConfig(s.config) && Array.isArray(s.transcript);
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      config: null,
      session: null,
      connectionStatus: "idle",
      error: null,
      elapsedSeconds: 0,

      setConfig: (config) => set({ config }),

      startSession: (session) =>
        set({
          session,
          connectionStatus: "connecting",
          error: null,
          elapsedSeconds: 0,
        }),

      addTranscriptEntry: (entry) => {
        const session = get().session;
        if (!session) return;
        set({
          session: {
            ...session,
            transcript: [...session.transcript, entry],
          },
        });
      },

      updateTranscriptEntry: (id, text) => {
        const session = get().session;
        if (!session) return;
        set({
          session: {
            ...session,
            transcript: session.transcript.map((e) =>
              e.id === id ? { ...e, text } : e
            ),
          },
        });
      },

      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

      setError: (error) => set({ error, connectionStatus: "error" }),

      setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),

      setEvaluation: (evaluation) => {
        const session = get().session;
        if (!session) return;
        set({
          session: { ...session, evaluation, evaluationError: undefined },
        });
      },

      setEvaluationError: (evaluationError) => {
        const session = get().session;
        if (!session) return;
        set({
          session: { ...session, evaluationError: evaluationError ?? undefined },
        });
      },

      endSession: () => {
        const session = get().session;
        if (!session) return;
        set({
          session: { ...session, endedAt: Date.now() },
          connectionStatus: "ended",
        });
      },

      reset: () =>
        set({
          session: null,
          connectionStatus: "idle",
          error: null,
          elapsedSeconds: 0,
        }),
    }),
    {
      name: "interview-assistant-storage-v2",
      partialize: (state) => ({
        config: state.config,
        session: state.session,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.config && !isValidConfig(state.config)) {
          state.config = null;
        }
        if (state.session && !isValidSession(state.session)) {
          state.session = null;
        }
      },
    }
  )
);
