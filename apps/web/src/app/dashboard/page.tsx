"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText, LogOut, Sparkles, Clock, Download,
    Trash2, User, ChevronRight, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

function getScoreColor(score: number): string {
    if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

    return (
        <div className="min-h-screen bg-muted/10">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <FileText className="size-5" />
                        </span>
                        <span className="text-lg tracking-tight">
                            Resume<span className="text-primary">Boost</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="size-4" />
                            <span>{user?.email}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                            <LogOut className="size-4" />
                            <span className="hidden sm:inline">Sign out</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold sm:text-3xl">
                        Welcome back, {firstName}! 👋
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Here are your optimized resumes. Data is automatically deleted after 30 days.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{sessions.length}</p>
                                    <p className="text-sm text-muted-foreground">Resumes optimized</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Sparkles className="size-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {sessions.length > 0
                                            ? Math.round(sessions.reduce((a, s) => a + s.ats_score, 0) / sessions.length)
                                            : "--"}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">Avg. ATS score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Clock className="size-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{5 - sessions.length}</p>
                                    <p className="text-sm text-muted-foreground">Optimizations left</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* New Optimization CTA */}
                <Card className="mb-8 border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold">Ready to optimize a new resume?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Upload your resume and paste a job description to get started.
                                </p>
                            </div>
                            <Button asChild className="gap-2 shrink-0">
                                <Link href="/optimize">
                                    <Sparkles className="size-4" />
                                    Optimize resume
                                    <ChevronRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Resume History */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Your Resumes</h2>

                    {sessions.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FileText className="size-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold mb-2">No resumes yet</h3>
                                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                                    Optimize your first resume and it will appear here with your ATS score and download link.
                                </p>
                                <Button asChild className="gap-2">
                                    <Link href="/optimize">
                                        <Sparkles className="size-4" />
                                        Optimize my resume
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => {
                                const daysLeft = getDaysLeft(session.expires_at);
                                const isExpiringSoon = daysLeft <= 7;

                                return (
                                    <Card key={session.id} className="overflow-hidden">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    {/* Resume name + score */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <h3 className="font-semibold">{session.resume_name}</h3>
                                                        <Badge variant={getScoreBadgeVariant(session.ats_score)}>
                                                            {session.ats_score}% ATS
                                                        </Badge>
                                                        {isExpiringSoon && (
                                                            <Badge variant="destructive" className="gap-1">
                                                                <AlertCircle className="size-3" />
                                                                Expires in {daysLeft}d
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* JD Preview */}
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        <span className="font-medium text-foreground">JD: </span>
                                                        {session.jd_preview}
                                                    </p>

                                                    {/* Skills */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {session.matched_skills.slice(0, 4).map(skill => (
                                                            <Badge key={skill} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                                ✓ {skill}
                                                            </Badge>
                                                        ))}
                                                        {session.missing_skills.slice(0, 2).map(skill => (
                                                            <Badge key={skill} variant="secondary" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                                                                ✗ {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    {/* Date + Expiry */}
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="size-3" />
                                                            {new Date(session.created_at).toLocaleDateString("en-IN", {
                                                                day: "numeric", month: "short", year: "numeric",
                                                                hour: "2-digit", minute: "2-digit"
                                                            })}
                                                        </span>
                                                        <span className={isExpiringSoon ? "text-red-500" : ""}>
                                                            Expires in {daysLeft} days
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {session.pdf_url && (
                                                        <Button size="sm" variant="outline" className="gap-2" asChild>
                                                            <a href={session.pdf_url} download>
                                                                <Download className="size-4" />
                                                                PDF
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="gap-2 text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteSession(session.id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 30 day notice */}
                <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3">
                    <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0" />
                        Your resume data is automatically deleted after 30 days to protect your privacy. Download your PDFs before they expire.
                    </p>
                </div>
            </main>
        </div>
    );
}