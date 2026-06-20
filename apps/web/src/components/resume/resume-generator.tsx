"use client";

import { useCallback, useState } from "react";
import { Loader2, Sparkles, Download, CheckCircle2 } from "lucide-react";
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
  
  // Hover state for Generate button
  const [isGenerateHovered, setIsGenerateHovered] = useState(false);

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
                            {s.label}
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
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-sm text-red-400"
                    role="alert"
                  >
                    {apiError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* CTA buttons */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
                {/* Generate Button Wrapper with Glow */}
                <div className="relative inline-block w-full sm:w-auto">
                  <div 
                    className="absolute inset-0 rounded-full bg-white/25 blur-[36px] opacity-0 transition-opacity duration-500 pointer-events-none"
                    style={{ opacity: isGenerateHovered && !isProcessing ? 1 : 0 }}
                  />
                  
                  <Button
                    type="button"
                    size="lg"
                    disabled={isProcessing}
                    onClick={handleGenerate}
                    onMouseEnter={() => setIsGenerateHovered(true)}
                    onMouseLeave={() => setIsGenerateHovered(false)}
                    className="relative w-full gap-2 sm:w-auto rounded-full border border-white bg-black hover:bg-black text-white font-medium transition-all duration-300"
                    style={{
                      transform: isGenerateHovered && !isProcessing ? "scale(1.03)" : "scale(1)",
                      boxShadow: isGenerateHovered && !isProcessing 
                        ? "0 0 30px rgba(255,255,255,0.25), 0 0 60px rgba(255,255,255,0.1), 0 0 90px rgba(255,255,255,0.05)"
                        : "none",
                      transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
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
                    className="w-full gap-2 sm:w-auto rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
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
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 text-sm text-emerald-455"
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
                <CardTitle className="flex items-center justify-between text-xl font-semibold text-white tracking-tight">
                  ATS Score
                  {atsScore && (
                    <Badge
                      variant={
                        atsScore.match_percentage >= 70
                          ? "default"
                          : atsScore.match_percentage >= 50
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-lg px-3 py-1 font-semibold rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300"
                    >
                      {atsScore.match_percentage}%
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm text-white/50">
                  {atsScore
                    ? "Real-time ATS analysis results"
                    : "Upload your resume to see your ATS score"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
                {!atsScore && !isProcessing && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-20 rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 rounded-2xl bg-blue-500/5 blur-[8px]" />
                      <Sparkles className="size-8 text-white z-10" />
                    </div>
                    <p className="text-sm text-white/50 max-w-[200px] leading-relaxed">
                      Your ATS score will appear here after analysis
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
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Match score</span>
                        <span className="font-semibold text-white">{atsScore.match_percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            atsScore.match_percentage >= 70
                              ? "bg-emerald-500"
                              : atsScore.match_percentage >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${atsScore.match_percentage}%` }}
                        />
                      </div>
                    </div>

                    {atsScore.matched_skills.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-emerald-400">
                          ✅ Matched Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {atsScore.matched_skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsScore.missing_skills.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-red-400">
                          ❌ Missing Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {atsScore.missing_skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs bg-red-500/10 border border-red-500/20 text-red-300 font-medium"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsScore.improvement_suggestions.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-semibold text-white/80">💡 Suggestions</p>
                        <ul className="space-y-2">
                          {atsScore.improvement_suggestions.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-xs text-white/50 flex gap-2 leading-relaxed">
                              <span className="shrink-0 text-blue-400">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
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