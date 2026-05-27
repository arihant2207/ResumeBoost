"use client";

import { useCallback, useState } from "react";

import type { UploadedResume } from "@/types";

/**
 * Client-side upload state hook.
 * Will connect to Supabase Storage presigned URLs in Phase 2.
 */
export function useUpload() {
  const [resume, setResume] = useState<UploadedResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: UploadedResume) => {
    setIsUploading(true);
    setError(null);
    try {
      // Phase 2: POST /uploads/init → upload to Supabase → POST /complete
      await new Promise((r) => setTimeout(r, 300));
      setResume(file);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResume(null);
    setError(null);
  }, []);

  return { resume, isUploading, error, upload, clear, setResume };
}
