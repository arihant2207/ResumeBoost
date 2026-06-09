"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { ResumeGenerator } from "@/components/resume/resume-generator";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function OptimizePage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.push("/login");
            } else {
                setLoading(false);
            }
        });
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 px-4 py-12 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8">
                        <Button variant="ghost" size="sm" className="gap-2 mb-4" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="size-4" />
                                Back to dashboard
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold sm:text-3xl">Optimize your resume</h1>
                        <p className="mt-2 text-muted-foreground">
                            Upload your resume and paste a job description. AI will optimize
                            your resume and generate an ATS-friendly PDF in minutes.
                        </p>
                    </div>
                    <ResumeGenerator />
                </div>
            </main>
            <Footer />
        </div>
    );
}