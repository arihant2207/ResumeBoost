"use client";

import { useCallback, useState } from "react";
import { Loader2, Sparkles, Download, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/resume/file-upload";
import { JobDescriptionForm } from "@/components/resume/job-description-form";
import {
  ApiError,
  processResumeAndJobDescription,
  analyzeSession,
  optimizeSession,
  downloadPdf,
  type AtsAnalysisResponse,
} from "@/lib/api-client";
import { MIN_JD_LENGTH } from "@/lib/constants";
import type { SessionResponse } from "@/types/api";
import type { UploadedResume } from "@/types";

type Step = "idle" | "uploading" | "analyzing" | "optimizing" | "generating" | "complete";

const STEPS: { key: Step; label: string }[] = [
  { key: "uploading", label: "Uploading resume" },
  { key: "analyzing", label: "Analyzing ATS score" },
  { key: "optimizing", label: "Optimizing resume" },
  { key: "generating", label: "Generating PDF" },
];

export function ResumeGenerator() {
  const [resume, setResume] = useState<UploadedResume | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [atsScore, setAtsScore] = useState<AtsAnalysisResponse | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

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
      setJdError(`Job description must be at least ${MIN_JD_LENGTH} characters.`);
      valid = false;
    } else {
      setJdError(null);
    }
    return valid;
  }, [resume, jobDescription]);

  const handleGenerate = async () => {
    if (!validate() || !resume) return;

    setApiError(null);
    setSession(null);
    setAtsScore(null);
    setPdfBlob(null);

    try {
      setStep("uploading");
      const result = await processResumeAndJobDescription(
        resume.file,
        jobDescription.trim()
      );
      setSession(result);

      setStep("analyzing");
      const analysis = await analyzeSession(result.id);
      setAtsScore(analysis);

      setStep("optimizing");
      await optimizeSession(result.id);

      setStep("generating");
      const blob = await downloadPdf(result.id);
      setPdfBlob(blob);

      setStep("complete");
    } catch (err) {
      setStep("idle");
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  };

  const handleDownload = () => {
    if (!pdfBlob || !session) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Optimized_Resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isProcessing = !["idle", "complete"].includes(step);
  const isComplete = step === "complete";
  const currentStepIndex = STEPS.findIndex((st) => st.key === step);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Resume Optimizer</CardTitle>
            <CardDescription>
              Upload your resume and paste the job description. AI will optimize
              your resume and generate an ATS-friendly PDF.
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
                  setStep("idle");
                  setPdfBlob(null);
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

            {isProcessing && (
              <div className="space-y-2">
                {STEPS.map((s, i) => {
                  const isDone = i < currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <div className="size-4 shrink-0 rounded-full border-2 border-muted" />
                      )}
                      <span className={`text-sm ${isCurrent ? "font-medium text-foreground" : isDone ? "text-muted-foreground line-through" : "text-muted-foreground"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {apiError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {apiError}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                size="lg"
                className="w-full gap-2 sm:w-auto"
                disabled={isProcessing}
                onClick={handleGenerate}
              >
                {isProcessing ? (
                  <><Loader2 className="size-4 animate-spin" aria-hidden />Processing…</>
                ) : (
                  <><Sparkles className="size-4" aria-hidden />{isComplete ? "Re-generate" : "Generate resume"}</>
                )}
              </Button>

              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                disabled={!isComplete || !pdfBlob}
                onClick={handleDownload}
              >
                <Download className="size-4" aria-hidden />
                Download PDF
              </Button>
            </div>

            {isComplete && session && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300" role="status">
                ✅ Resume optimized successfully! Click Download PDF to save.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ATS Score
                {atsScore && (
                  <Badge
                    variant={atsScore.match_percentage >= 70 ? "default" : atsScore.match_percentage >= 50 ? "secondary" : "destructive"}
                    className="text-lg px-3 py-1"
                  >
                    {atsScore.match_percentage}%
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {atsScore ? "Real-time ATS analysis results" : "Upload your resume to see your ATS score"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!atsScore && !isProcessing && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Sparkles className="size-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Your ATS score will appear here after analysis</p>
                </div>
              )}

              {isProcessing && step === "analyzing" && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing your resume...</p>
                </div>
              )}

              {atsScore && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Match score</span>
                      <span className="font-medium">{atsScore.match_percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${atsScore.match_percentage >= 70 ? "bg-emerald-500" : atsScore.match_percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${atsScore.match_percentage}%` }}
                      />
                    </div>
                  </div>

                  {atsScore.matched_skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✅ Matched Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsScore.matched_skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {atsScore.missing_skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">❌ Missing Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsScore.missing_skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {atsScore.improvement_suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">💡 Suggestions</p>
                      <ul className="space-y-1">
                        {atsScore.improvement_suggestions.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}