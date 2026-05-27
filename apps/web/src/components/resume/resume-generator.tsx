"use client";

import { useCallback, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/resume/file-upload";
import { JobDescriptionForm } from "@/components/resume/job-description-form";
import { AtsScoreCard } from "@/components/resume/ats-score-card";
import { DownloadButton } from "@/components/resume/download-button";
import { ParsedResultCard } from "@/components/resume/parsed-result-card";
import { ApiError, processResumeAndJobDescription } from "@/lib/api-client";
import { MIN_JD_LENGTH, PLACEHOLDER_ATS_SCORE } from "@/lib/constants";
import type { SessionResponse } from "@/types/api";
import type {
  AtsScorePlaceholder,
  GenerationStatus,
  UploadedResume,
} from "@/types";

export function ResumeGenerator() {
  const [resume, setResume] = useState<UploadedResume | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [atsScore, setAtsScore] = useState<AtsScorePlaceholder | null>(null);

  const validate = useCallback((): boolean => {
    let valid = true;
    if (!resume) {
      setResumeError("Please upload your resume.");
      valid = false;
    } else {
      setResumeError(null);
    }
    if (!jobDescription.trim()) {
      setJdError("Please paste the job description.");
      valid = false;
    } else if (jobDescription.trim().length < MIN_JD_LENGTH) {
      setJdError(
        `Job description must be at least ${MIN_JD_LENGTH} characters.`
      );
      valid = false;
    } else {
      setJdError(null);
    }
    return valid;
  }, [resume, jobDescription]);

  const handleGenerate = async () => {
    if (!validate() || !resume) return;

    setStatus("generating");
    setApiError(null);
    setSession(null);
    setAtsScore(null);

    try {
      const result = await processResumeAndJobDescription(
        resume.file,
        jobDescription.trim()
      );
      setSession(result);

      // ATS score remains placeholder until Claude is added in a later phase
      setAtsScore({
        overall: PLACEHOLDER_ATS_SCORE.overall,
        keywordMatch: PLACEHOLDER_ATS_SCORE.keywordMatch,
        formatting: PLACEHOLDER_ATS_SCORE.formatting,
        structure: PLACEHOLDER_ATS_SCORE.structure,
        matchedKeywords: [...PLACEHOLDER_ATS_SCORE.matchedKeywords],
        missingKeywords: [...PLACEHOLDER_ATS_SCORE.missingKeywords],
      });
      setStatus("complete");
    } catch (err) {
      setStatus("idle");
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError("Something went wrong. Is the API running on port 8000?");
      }
    }
  };

  const handleDownload = () => {
    alert(
      "PDF download will be available in a later phase. Your resume text has been parsed and stored in the session."
    );
  };

  const isGenerating = status === "generating";
  const isComplete = status === "complete";

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Resume optimizer</CardTitle>
            <CardDescription>
              Upload your resume and paste the job description. The backend
              extracts text and returns structured JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Your resume</p>
              <FileUpload
                value={resume}
                onChange={(f) => {
                  setResume(f);
                  setResumeError(null);
                  setSession(null);
                  setStatus("idle");
                }}
                error={resumeError}
              />
            </div>

            <JobDescriptionForm
              value={jobDescription}
              onChange={(v) => {
                setJobDescription(v);
                setJdError(null);
              }}
              error={jdError}
            />

            <Separator />

            {apiError && (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {apiError}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                disabled={isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Processing…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" aria-hidden />
                    Generate resume
                  </>
                )}
              </Button>

              <DownloadButton disabled={!isComplete} onClick={handleDownload} />
            </div>

            {isComplete && session && (
              <p
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                role="status"
              >
                Resume parsed successfully. Session ID:{" "}
                <code className="text-xs">{session.id.slice(0, 8)}…</code>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <AtsScoreCard
            score={atsScore}
            isPlaceholder={isComplete}
            className="h-full"
          />
        </div>
      </div>

      {session && <ParsedResultCard session={session} />}
    </div>
  );
}
