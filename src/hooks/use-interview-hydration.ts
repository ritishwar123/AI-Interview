"use client";

import { useEffect, useState } from "react";
import { useInterviewStore } from "@/store/interview-store";

export function useInterviewHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useInterviewStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    return useInterviewStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}
