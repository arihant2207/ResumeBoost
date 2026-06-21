"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { ResumeGenerator } from "@/components/resume/resume-generator";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/layout/footer";
import {
  buttonHoverVariant,
  buttonTapVariant,
  buttonTransition,
} from "@/components/motion/fade-in";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function OptimizePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-blue-400" />
          <p className="text-sm text-white/50">Loading resume optimizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col">
      {/* Extremely subtle blue ambient fog near bottom and mid corners */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/[0.008] blur-[160px] pointer-events-none" />

      {/* Header - Dark theme matching Dashboard */}
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

      {/* Main Content with soft scale & fade entrance motion */}
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-8">
            <motion.div
              whileHover={buttonHoverVariant}
              whileTap={buttonTapVariant}
              transition={buttonTransition}
              className="inline-block mb-4"
            >
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 rounded-full py-1.5 px-4 border border-white/5"
                asChild
              >
                <Link href="/dashboard">
                  <ArrowLeft className="size-4" />
                  Back to dashboard
                </Link>
              </Button>
            </motion.div>
            <h1 className="text-3xl font-light sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
              Optimize your resume
            </h1>
            <p className="mt-3 text-lg leading-relaxed max-w-2xl font-sans" style={{ color: "rgba(255,255,255,0.70)" }}>
              Upload your resume and paste a job description. AI will optimize
              your resume and generate an ATS-friendly PDF in minutes.
            </p>
          </div>

          <ResumeGenerator />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}