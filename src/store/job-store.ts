import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JobPosting } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface JobStore {
  jobs: JobPosting[];
  addJob: (job: Omit<JobPosting, "id" | "createdAt">) => JobPosting;
  getJob: (id: string) => JobPosting | undefined;
  removeJob: (id: string) => void;
}

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (jobData) => {
        const job: JobPosting = {
          ...jobData,
          id: generateId(),
          createdAt: Date.now(),
        };
        set({ jobs: [job, ...get().jobs] });
        return job;
      },

      getJob: (id) => get().jobs.find((j) => j.id === id),

      removeJob: (id) =>
        set({ jobs: get().jobs.filter((j) => j.id !== id) }),
    }),
    { name: "company-jobs-storage" }
  )
);
