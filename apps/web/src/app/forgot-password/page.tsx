"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hover states for button glows
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    // Generic response to prevent user enumeration
    setMessage("If an account exists for this email, a reset link has been sent.");
    
    if (error) {
      console.error("Reset password error:", error.message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050505] px-4 overflow-hidden">
      {/* Extremely subtle blue ambient fog near bottom corners */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/[0.015] blur-[150px] pointer-events-none" />

      {/* Page entrance animation */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        {/* Wordmark logo */}
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        {/* Auth Glass Card */}
        <Card className="rounded-[24px] border-white/[0.10] bg-white/[0.02] backdrop-blur-md shadow-2xl relative overflow-hidden text-left">
          {/* Subtle blue reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-500/[0.012] pointer-events-none" />

          <CardHeader className="text-center relative z-10 pb-4">
            <CardTitle className="text-2xl font-semibold text-white tracking-tight">Reset password</CardTitle>
            <CardDescription className="text-sm text-white/50">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 relative z-10">
            {message ? (
              <div className="space-y-4">
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 text-sm text-emerald-400">
                  {message}
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
                  >
                    <Link href="/login">Back to login</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border border-white/[0.10] bg-white/[0.03] text-white placeholder-white/40 focus:border-white/20 focus:bg-white/[0.05] focus:ring-1 focus:ring-blue-500/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-300"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-sm text-red-400">
                    {error}
                  </p>
                )}

                {/* Primary submit button with CTA white glow hover system */}
                <div className="relative pt-2">
                  <div
                    className="absolute inset-0 rounded-full bg-white/20 blur-[24px] opacity-0 transition-opacity duration-500 pointer-events-none"
                    style={{ opacity: isSubmitHovered && !loading ? 1 : 0 }}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={() => setIsSubmitHovered(true)}
                    onMouseLeave={() => setIsSubmitHovered(false)}
                    className="relative w-full rounded-full border border-white bg-black hover:bg-black text-white font-medium transition-all duration-300"
                    style={{
                      transform: isSubmitHovered && !loading ? "scale(1.03)" : "scale(1)",
                      boxShadow: isSubmitHovered && !loading
                        ? "0 0 24px rgba(255,255,255,0.2), 0 0 48px rgba(255,255,255,0.08)"
                        : "none",
                      transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          {!message && (
            <CardFooter className="justify-center border-t border-white/[0.05] py-4">
              <Link
                href="/login"
                className="relative text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-300 group py-0.5 inline-block"
              >
                Back to login
                <span className="absolute left-0 bottom-0 w-full h-[1px] bg-blue-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
