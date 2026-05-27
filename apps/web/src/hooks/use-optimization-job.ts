"use client";

import { useCallback, useState } from "react";

import type { AtsScorePlaceholder, GenerationStatus } from "@/types";

/**
 * Optimization job polling hook.
 * Will poll GET /optimizations/{id} when FastAPI backend is ready.
 */
export function useOptimizationJob() {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [atsScore, setAtsScore] = useState<AtsScorePlaceholder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (..._args: [string, string]) => {
    void _args;
    setStatus("generating");
    setError(null);
    setProgress(0);
    setJobId("preview-job-id");

    // Phase 2: POST /optimizations → poll until complete
    setProgress(50);
    await new Promise((r) => setTimeout(r, 500));
    setProgress(100);
    setStatus("complete");
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setJobId(null);
    setProgress(0);
    setAtsScore(null);
    setError(null);
  }, []);

  return {
    status,
    jobId,
    progress,
    atsScore,
    setAtsScore,
    error,
    start,
    reset,
  };
}
