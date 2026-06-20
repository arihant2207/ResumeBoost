"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut, Sparkles, Clock, Download,
  Trash2, User, ChevronRight, AlertCircle, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import {
  StaggerContainer,
  StaggerItem,
  FadeInWhenVisible,
  cardHoverVariant,
  cardTransition,
  buttonHoverVariant,
  buttonTapVariant,
  buttonTransition,
} from "@/components/motion/fade-in";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ResumeSession {
  id: string;
  resume_name: string;
  jd_preview: string;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  pdf_url: string | null;
  created_at: string;
  expires_at: string;
}

function getDaysLeft(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 70) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [sessions, setSessions] = useState<ResumeSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Button hover states
  const [isOptHovered, setIsOptHovered] = useState(false);
  const [isEmptyOptHovered, setIsEmptyOptHovered] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      // In future: fetch sessions from Supabase DB
      // For now show empty state
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-blue-400" />
          <p className="text-sm text-white/50">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col">
      {/* Extremely subtle blue ambient fog near bottom and mid corners */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/[0.008] blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050505]/60 backdrop-blur-md relative z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Wordmark logo */}
          <Logo size="md" />

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/60 font-sans">
              <User className="size-4 text-white/40" />
              <span>{user?.email}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 rounded-full py-1.5 px-3"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 relative z-10 flex-1 w-full">
        {/* Welcome Header */}
        <FadeInWhenVisible>
          <div className="mb-12 text-left">
            <h1 className="text-3xl font-light sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="mt-3 text-white/70 font-sans leading-relaxed max-w-2xl text-base sm:text-lg">
              Here are your optimized resumes. Data is automatically deleted after 30 days.
            </p>
          </div>
        </FadeInWhenVisible>

        {/* Stats — stagger cascade on load */}
        <StaggerContainer className="grid gap-6 sm:grid-cols-3 mb-10">
          {/* Stat: Resumes optimized */}
          <StaggerItem>
            <Card className="h-full rounded-[20px] border-white/[0.10] bg-white/[0.02] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(59,130,246,0.03)] text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-white/90">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-white tracking-tight">{sessions.length}</p>
                    <p className="text-sm text-white/50 mt-0.5 font-sans">Resumes optimized</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Stat: Avg ATS score */}
          <StaggerItem>
            <Card className="h-full rounded-[20px] border-white/[0.10] bg-white/[0.02] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(59,130,246,0.03)] text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-white/90">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-white tracking-tight">
                      {sessions.length > 0
                        ? Math.round(sessions.reduce((a, s) => a + s.ats_score, 0) / sessions.length)
                        : "--"}%
                    </p>
                    <p className="text-sm text-white/50 mt-0.5 font-sans">Avg. ATS score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Stat: Optimizations left */}
          <StaggerItem>
            <Card className="h-full rounded-[20px] border-white/[0.10] bg-white/[0.02] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(59,130,246,0.03)] text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-white/90">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-white tracking-tight">{5 - sessions.length}</p>
                    <p className="text-sm text-white/50 mt-0.5 font-sans">Optimizations left</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* New Optimization CTA - Premium Featured Card */}
        <FadeInWhenVisible delay={0.1}>
          <Card className="mb-10 rounded-[20px] border-white/[0.12] bg-white/[0.02] backdrop-blur-md relative overflow-hidden text-left">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.015] pointer-events-none" />
            <CardContent className="pt-6 pb-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="font-semibold text-white text-lg tracking-tight">Ready to optimize a new resume?</h3>
                  <p className="text-sm text-white/50 mt-1 max-w-xl leading-relaxed">
                    Upload your resume and paste a job description to get started.
                  </p>
                </div>
                
                {/* CTA Glow Button */}
                <div className="relative inline-block w-full sm:w-auto shrink-0">
                  <div 
                    className="absolute inset-0 rounded-full bg-white/20 blur-[24px] opacity-0 transition-opacity duration-500 pointer-events-none"
                    style={{ opacity: isOptHovered ? 1 : 0 }}
                  />
                  <Button 
                    asChild 
                    onMouseEnter={() => setIsOptHovered(true)}
                    onMouseLeave={() => setIsOptHovered(false)}
                    className="relative w-full sm:w-auto rounded-full border border-white bg-black hover:bg-black text-white font-medium transition-all duration-300 py-2.5 px-5"
                    style={{
                      transform: isOptHovered ? "scale(1.03)" : "scale(1)",
                      boxShadow: isOptHovered 
                        ? "0 0 20px rgba(255,255,255,0.2), 0 0 40px rgba(255,255,255,0.08)"
                        : "none",
                      transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <Link href="/optimize" className="gap-2 shrink-0">
                      <Sparkles className="size-4" />
                      Optimize resume
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInWhenVisible>

        {/* Resume History */}
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Your Resumes</h2>

          {sessions.length === 0 ? (
            <FadeInWhenVisible delay={0.15}>
              <Card className="rounded-[24px] border-white/[0.10] bg-white/[0.02] backdrop-blur-md relative overflow-hidden text-center py-20 px-8 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />
                <CardContent className="flex flex-col items-center justify-center p-0 relative z-10">
                  <div className="size-16 rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/5 blur-[8px]" />
                    <FileText className="size-8 text-white z-10" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white tracking-tight mb-2">No resumes yet</h3>
                  <p className="text-sm text-white/50 mb-8 max-w-sm leading-relaxed">
                    Optimize your first resume and it will appear here with your ATS score and download link.
                  </p>
                  
                  {/* Empty state CTA Button */}
                  <div className="relative">
                    <div 
                      className="absolute inset-0 rounded-full bg-white/20 blur-[24px] opacity-0 transition-opacity duration-500 pointer-events-none"
                      style={{ opacity: isEmptyOptHovered ? 1 : 0 }}
                    />
                    <Button
                      asChild
                      onMouseEnter={() => setIsEmptyOptHovered(true)}
                      onMouseLeave={() => setIsEmptyOptHovered(false)}
                      className="relative w-full sm:w-auto rounded-full border border-white bg-black hover:bg-black text-white font-medium transition-all duration-300 py-2.5 px-6"
                      style={{
                        transform: isEmptyOptHovered ? "scale(1.03)" : "scale(1)",
                        boxShadow: isEmptyOptHovered 
                          ? "0 0 20px rgba(255,255,255,0.2), 0 0 40px rgba(255,255,255,0.08)"
                          : "none",
                        transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <Link href="/optimize" className="gap-2">
                        <Sparkles className="size-4" />
                        Optimize my resume
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </FadeInWhenVisible>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const daysLeft = getDaysLeft(session.expires_at);
                const isExpiringSoon = daysLeft <= 7;

                return (
                  <FadeInWhenVisible key={session.id} delay={index * 0.05}>
                    <Card className="rounded-[20px] border-white/[0.10] bg-white/[0.02] p-6 hover:border-white/20 transition-all duration-300 overflow-hidden relative text-left">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />
                      <CardContent className="p-0 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                          <div className="flex-1 space-y-3">
                            {/* Resume name + score */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-white text-lg tracking-tight">{session.resume_name}</h3>
                              <Badge className="font-semibold rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                                {session.ats_score}% ATS
                              </Badge>
                              {isExpiringSoon && (
                                <Badge className="font-semibold rounded-full bg-red-500/10 border border-red-500/20 text-red-400 gap-1">
                                  <AlertCircle className="size-3" />
                                  Expires in {daysLeft}d
                                </Badge>
                              )}
                            </div>

                            {/* JD Preview */}
                            <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                              <span className="font-semibold text-white/70">JD: </span>
                              {session.jd_preview}
                            </p>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {session.matched_skills.slice(0, 4).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                                  ✓ {skill}
                                </Badge>
                              ))}
                              {session.missing_skills.slice(0, 2).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs bg-red-500/10 border border-red-500/20 text-red-300 font-medium">
                                  ✗ {skill}
                                </Badge>
                              ))}
                            </div>

                            {/* Date + Expiry */}
                            <div className="flex items-center gap-4 text-xs text-white/40 pt-1 font-mono">
                              <span className="flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                {new Date(session.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                              <span className={isExpiringSoon ? "text-red-400 font-medium" : ""}>
                                Expires in {daysLeft} days
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-start">
                            {session.pdf_url && (
                              <Button 
                                size="sm" 
                                className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2 transition-all duration-300 py-1.5 px-4 font-medium"
                                asChild
                              >
                                <a href={session.pdf_url} download>
                                  <Download className="size-4" />
                                  PDF
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeInWhenVisible>
                );
              })}
            </div>
          )}
        </div>

        {/* 30 day warning banner - Amber dark glass */}
        <div className="mt-12 rounded-[20px] border border-amber-500/20 bg-[#281505]/40 backdrop-blur-md px-5 py-4 shadow-[0_0_20px_rgba(245,158,11,0.02)] text-left">
          <p className="text-sm text-amber-300 flex items-center gap-3 leading-relaxed">
            <AlertCircle className="size-5 shrink-0 text-amber-400" />
            Your resume data is automatically deleted after 30 days to protect your privacy. Download your PDFs before they expire.
          </p>
        </div>
      </main>
    </div>
  );
}

// Simple loader icon placeholder
function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className ?? ""}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  );
}