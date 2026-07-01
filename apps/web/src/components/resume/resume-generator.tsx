"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Download, CheckCircle2, AlertCircle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
import {
  FadeIn,
  buttonHoverVariant,
  buttonTapVariant,
  buttonTransition,
} from "@/components/motion/fade-in";

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
  
  // Retry and Countdown states
  const [failedStep, setFailedStep] = useState<Step | null>(null);
  const [autoRetry, setAutoRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Show All toggles for ATS UI
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Hover state for Generate button
  const [isGenerateHovered, setIsGenerateHovered] = useState(false);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

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

  const runFlow = async (startFrom: Step, currentAttempts = 0) => {
    if (!resume) return;
    setApiError(null);
    setFailedStep(null);
    setCountdown(null);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    let activeStep: Step = startFrom;
    try {
      let currentSession = session;

      if (startFrom === "uploading" || !currentSession) {
        activeStep = "uploading";
        setStep("uploading");
        currentSession = await processResumeAndJobDescription(
          resume.file,
          jobDescription.trim()
        );
        setSession(currentSession);
      }

      if (startFrom === "uploading" || startFrom === "analyzing" || !atsScore) {
        activeStep = "analyzing";
        setStep("analyzing");
        const analysis = await analyzeSession(currentSession.id);
        setAtsScore(analysis);
      }

      if (startFrom === "uploading" || startFrom === "analyzing" || startFrom === "optimizing") {
        activeStep = "optimizing";
        setStep("optimizing");
        await optimizeSession(currentSession.id);
      }

      if (startFrom === "uploading" || startFrom === "analyzing" || startFrom === "optimizing" || startFrom === "generating") {
        activeStep = "generating";
        setStep("generating");
        const blob = await downloadPdf(currentSession.id);
        setPdfBlob(blob);
      }

      setStep("complete");
      setRetryCount(0);
    } catch (err) {
      console.error("Error running flow step:", activeStep, err);
      const errMsg = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";

      if (autoRetry && currentAttempts < 3) {
        setRetryCount(currentAttempts + 1);
        setStep("idle");
        setFailedStep(activeStep);
        setApiError(errMsg);

        let count = 5;
        setCountdown(count);
        countdownIntervalRef.current = setInterval(() => {
          count -= 1;
          if (count <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setCountdown(null);
            runFlow(activeStep, currentAttempts + 1);
          } else {
            setCountdown(count);
          }
        }, 1000);
      } else {
        setStep("idle");
        setFailedStep(activeStep);
        setApiError(errMsg);
      }
    }
  };

  const handleGenerate = () => {
    if (!validate() || !resume) return;
    setSession(null);
    setAtsScore(null);
    setPdfBlob(null);
    setRetryCount(0);
    setShowAllMissing(false);
    setShowAllSuggestions(false);
    runFlow("uploading");
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

  const getStepLabel = (key: Step, defaultLabel: string) => {
    if (step !== key) return defaultLabel;
    switch (key) {
      case "uploading": return "Uploading your resume...";
      case "analyzing": return "Analyzing your resume against the job description...";
      case "optimizing": return "AI is rewriting your resume bullets...";
      case "generating": return "Generating your PDF...";
      default: return defaultLabel;
    }
  };

  return (
    <div className="space-y-8">
      {/* 70/30 Grid Layout on desktop */}
      <div className="grid gap-12 lg:grid-cols-10">
        {/* Main optimizer card - 70% width */}
        <FadeIn className="lg:col-span-7">
          <Card className="rounded-[24px] border-white/[0.10] bg-white/[0.02] backdrop-blur-md shadow-2xl relative overflow-hidden text-left">
            {/* Subtle blue reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />

            <CardHeader className="space-y-2 relative z-10">
              <CardTitle className="text-2xl font-semibold text-white tracking-tight">
                Resume Optimizer
              </CardTitle>
              <CardDescription className="text-sm text-white/50 leading-relaxed">
                Upload your resume and paste the job description. AI will optimize
                your resume and generate an ATS-friendly PDF.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/80">Your resume</p>
                <FileUpload
                  value={resume}
                  onChange={(f) => {
                    setResume(f);
                    setResumeError(null);
                    setSession(null);
                    setStep("idle");
                    setPdfBlob(null);
                    setFailedStep(null);
                    setApiError(null);
                    setRetryCount(0);
                    setCountdown(null);
                    setShowAllMissing(false);
                    setShowAllSuggestions(false);
                    if (countdownIntervalRef.current) {
                      clearInterval(countdownIntervalRef.current);
                      countdownIntervalRef.current = null;
                    }
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

              <Separator className="bg-white/[0.08]" />

              {/* Step progress — AnimatePresence so the list smoothly appears/disappears */}
              <AnimatePresence mode="wait">
                {isProcessing && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                  >
                    {STEPS.map((s, i) => {
                      const isDone = i < currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <motion.div
                          key={s.key}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          {isDone ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                          ) : isCurrent ? (
                            <Loader2 className="size-4 shrink-0 animate-spin text-blue-400" />
                          ) : (
                            <div className="size-4 shrink-0 rounded-full border border-white/20" />
                          )}
                          <span
                            className={`text-sm ${
                              isCurrent
                                ? "font-medium text-white"
                                : isDone
                                ? "text-white/40 line-through"
                                : "text-white/40"
                            }`}
                          >
                            {getStepLabel(s.key, s.label)}
                            {isCurrent && (
                              <span className="inline-flex items-center">
                                <span className="animate-pulse bg-blue-400 size-1 rounded-full ml-1.5 inline-block" />
                                <span className="animate-pulse bg-blue-400 size-1 rounded-full ml-1 inline-block [animation-delay:0.2s]" />
                                <span className="animate-pulse bg-blue-400 size-1 rounded-full ml-1 inline-block [animation-delay:0.4s]" />
                              </span>
                            )}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* API error banner — AnimatePresence for smooth appear/disappear */}
              <AnimatePresence mode="wait">
                {apiError && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] backdrop-blur-md p-5 text-left relative overflow-hidden"
                    role="alert"
                  >
                    <div className="flex items-start gap-4">
                      <div className="size-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                        <AlertCircle className="size-5" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-base font-semibold text-white tracking-tight">AI is temporarily busy</h4>
                        <p className="text-sm text-white/70 leading-relaxed">
                          Google's AI servers are under high load. This is temporary — please wait a few seconds and try again.
                        </p>
                        <p className="text-xs text-red-400/80">
                          Error detail: {apiError}
                        </p>
                        {countdown !== null ? (
                          <p className="text-xs font-semibold text-blue-400 animate-pulse pt-1">
                            Auto-retrying in {countdown}s... (Attempt {retryCount}/3)
                          </p>
                        ) : (
                          <p className="text-xs text-white/40 pt-1">
                            Usually resolves in 10-30 seconds.
                          </p>
                        )}
                        
                        {countdown === null && (
                          <div className="flex gap-3 pt-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => runFlow(failedStep || "uploading")}
                              className="rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 text-xs font-semibold transition-all duration-300"
                            >
                              Try Again
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Auto-retry option */}
              {!isProcessing && !isComplete && (
                <div className="flex items-center gap-2 select-none pt-2 text-white/60 hover:text-white/80 transition-colors duration-300">
                  <input
                    type="checkbox"
                    id="auto-retry"
                    checked={autoRetry}
                    onChange={(e) => setAutoRetry(e.target.checked)}
                    className="size-4 rounded border-white/20 bg-white/5 checked:bg-blue-500 accent-blue-500 cursor-pointer"
                  />
                  <label htmlFor="auto-retry" className="text-xs font-medium cursor-pointer">
                    Auto-retry if AI is busy (up to 3 times)
                  </label>
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
                {/* Generate Button Wrapper with Glow */}
                <div className="relative inline-flex w-full sm:w-auto">
                  {/* Ambient radial halo behind button */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 -z-10 rounded-full"
                    style={{
                      width: "200%",
                      height: "380%",
                      transform: `translate(-50%, -50%) scale(${isGenerateHovered && !isProcessing ? 1 : 0.35})`,
                      opacity: isGenerateHovered && !isProcessing ? 1 : 0,
                      background:
                        "radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)",
                      filter: "blur(20px)",
                      transition: "opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                  
                  <Button
                    type="button"
                    size="lg"
                    disabled={isProcessing}
                    onClick={handleGenerate}
                    onMouseEnter={() => setIsGenerateHovered(true)}
                    onMouseLeave={() => setIsGenerateHovered(false)}
                    className="relative w-full gap-2 sm:w-auto rounded-full border border-white bg-black hover:bg-black text-white font-semibold transition-all duration-300 py-3.5 px-8"
                    style={{
                      transform: isGenerateHovered && !isProcessing ? "scale(1.03)" : "scale(1)",
                      boxShadow: isGenerateHovered && !isProcessing 
                        ? "0 0 40px rgba(255,255,255,0.35), 0 0 80px rgba(255,255,255,0.15), 0 0 120px rgba(255,255,255,0.08)"
                        : "none",
                      transition: "box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {isProcessing ? (
                      <><Loader2 className="size-4 animate-spin" aria-hidden />Processing…</>
                    ) : (
                      <><Sparkles className="size-4" aria-hidden />{isComplete ? "Re-generate" : "Generate resume"}</>
                    )}
                  </Button>
                </div>

                {/* Secondary Download Button */}
                <div className="w-full sm:w-auto">
                  <Button
                    type="button"
                    size="lg"
                    disabled={!isComplete || !pdfBlob}
                    onClick={handleDownload}
                    className="w-full gap-2 sm:w-auto rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none py-3.5 px-8 font-semibold"
                  >
                    <Download className="size-4" aria-hidden />
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* Success banner — AnimatePresence */}
              <AnimatePresence mode="wait">
                {isComplete && session && (
                  <motion.p
                    key="success"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 text-sm text-emerald-400 font-sans"
                    role="status"
                  >
                    ✅ Resume optimized successfully! Click Download PDF to save.
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </FadeIn>

        {/* ATS Score card - 30% width */}
        <FadeIn delay={0.1} className="lg:col-span-3">
          <Card className="h-full rounded-[24px] border-white/[0.10] bg-white/[0.02] backdrop-blur-md shadow-2xl relative overflow-hidden text-left flex flex-col justify-between">
            {/* Subtle blue reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white tracking-tight">
                  ATS Score
                </CardTitle>
                <CardDescription className="text-sm text-white/50">
                  {atsScore
                    ? "Real-time ATS analysis results"
                    : "Upload your resume to see your ATS score"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
                {!atsScore && !isProcessing && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="size-16 rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 rounded-2xl bg-blue-500/5 blur-[8px]" />
                      <Sparkles className="size-6 text-white z-10" />
                    </div>
                    <h3 className="text-base font-semibold text-white tracking-tight mb-2">Awaiting analysis</h3>
                    <p className="text-sm text-white/50 max-w-[220px] leading-relaxed">
                      Your ATS score and detailed skill breakdown will appear here.
                    </p>
                  </div>
                )}

                {isProcessing && step === "analyzing" && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-blue-450 mb-4" />
                    <p className="text-sm text-white/50">Analyzing your resume...</p>
                  </div>
                )}

                {atsScore && (
                  <div className="space-y-6 text-left w-full">
                    {/* Section A — Score ring */}
                    <ScoreRing value={atsScore.match_percentage} />

                    {/* Section B — Matched Skills */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <p className="font-semibold text-emerald-400">✅ Matched Skills</p>
                        <span className="text-white/40 font-medium">
                          {atsScore.matched_skills.length} of {atsScore.matched_skills.length + atsScore.missing_skills.length} required matched
                        </span>
                      </div>
                      {atsScore.matched_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {atsScore.matched_skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium rounded-full py-0.5 px-2.5"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 italic">No skills matched.</p>
                      )}
                    </div>

                    {/* Section C — Missing Skills */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-red-400">❌ Missing Skills</p>
                      {atsScore.missing_skills.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {(showAllMissing ? atsScore.missing_skills : atsScore.missing_skills.slice(0, 5)).map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-[11px] bg-red-500/10 border border-red-500/20 text-red-300 font-medium rounded-full py-0.5 px-2.5"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          {atsScore.missing_skills.length > 5 && (
                            <button
                              type="button"
                              onClick={() => setShowAllMissing(!showAllMissing)}
                              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mt-1 cursor-pointer"
                            >
                              {showAllMissing ? (
                                <><ChevronUp className="size-3" /> Show less</>
                              ) : (
                                <><ChevronDown className="size-3" /> Show all {atsScore.missing_skills.length}</>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-white/40 italic">No missing skills.</p>
                      )}
                    </div>

                    {/* Section D — AI Suggestions */}
                    {atsScore.improvement_suggestions && atsScore.improvement_suggestions.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <p className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                          <Lightbulb className="size-4 text-amber-400" />
                          How to improve your score
                        </p>
                        <div className="space-y-2">
                          {(showAllSuggestions ? atsScore.improvement_suggestions : atsScore.improvement_suggestions.slice(0, 3)).map((s, i) => (
                            <div
                              key={i}
                              className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 text-[11px] text-white/70 leading-relaxed flex gap-2 items-start"
                            >
                              <span className="shrink-0 size-4 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-[9px]">
                                {i + 1}
                              </span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                        {atsScore.improvement_suggestions.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            {showAllSuggestions ? (
                              <><ChevronUp className="size-3" /> Show less</>
                            ) : (
                              <><ChevronDown className="size-3" /> Show all {atsScore.improvement_suggestions.length}</>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Section E — Key ATS Keywords */}
                    {atsScore.ats_keywords && atsScore.ats_keywords.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div>
                          <p className="text-xs font-semibold text-blue-400">🔑 High-value keywords to include</p>
                          <p className="text-[10px] text-white/40 mt-0.5 leading-normal">
                            Consider naturally incorporating these keywords from the job description into your resume
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {atsScore.ats_keywords.map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="secondary"
                              className="text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium rounded-full py-0.5 px-2.5"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 34; // radius = 34
  const offset = circumference - (value / 100) * circumference;
  const colorClass = value >= 70 ? "text-emerald-500" : value >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="relative flex size-24 shrink-0 items-center justify-center mx-auto mb-2">
      <svg className="size-24 -rotate-90" viewBox="0 0 80 80" aria-hidden>
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-white/[0.04]"
        />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white tracking-tight">{value}%</span>
        <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider">Match</span>
      </div>
    </div>
  );
}