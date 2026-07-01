"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  // Hover states for button glows
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session) {
          setCanReset(true);
        }
        setIsVerifying(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === "PASSWORD_RECOVERY" || session) {
          setCanReset(true);
        }
        setIsVerifying(false);
      }
    });

    const timer = setTimeout(() => {
      if (mounted) {
        setIsVerifying(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
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
            <CardTitle className="text-2xl font-semibold text-white tracking-tight">Set new password</CardTitle>
            <CardDescription className="text-sm text-white/50">
              Please enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 relative z-10">
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <Loader2 className="size-8 animate-spin text-blue-400" />
                <p className="text-sm text-white/60">Verifying session...</p>
              </div>
            ) : !canReset ? (
              <div className="space-y-4 text-center">
                <p className="rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-sm text-red-400">
                  Your password reset link is invalid, expired, or has already been used.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
                  >
                    <Link href="/forgot-password">Request a new link</Link>
                  </Button>
                </div>
              </div>
            ) : success ? (
              <div className="space-y-4 text-center">
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 text-sm text-emerald-400">
                  Password updated successfully! Redirecting you to login...
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
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/80">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border border-white/[0.10] bg-white/[0.03] text-white placeholder-white/40 focus:border-white/20 focus:bg-white/[0.05] focus:ring-1 focus:ring-blue-500/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-300"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      "Update password"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
