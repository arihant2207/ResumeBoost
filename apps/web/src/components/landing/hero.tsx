import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const highlights = [
  "ATS-optimized formatting",
  "Keyword matching score",
  "LaTeX PDF export",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
      <div className="gradient-mesh absolute inset-0 -z-10" aria-hidden />

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5" aria-hidden />
            AI Resume Generator
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Land more interviews with an{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              ATS-perfect resume
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Upload your resume, paste the job description, and let AI tailor
            your experience to what recruiters and applicant tracking systems
            are looking for.
          </p>

          <ul className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2
                  className="size-4 shrink-0 text-primary"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
              <Link href="#generator">
                Optimize my resume
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              asChild
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border bg-card/80 p-1 shadow-xl backdrop-blur-sm">
          <div className="rounded-xl bg-gradient-to-br from-primary/5 via-background to-violet-500/5 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Avg. ATS score lift" value="+24%" />
              <StatCard label="Time to optimize" value="~2 min" />
              <StatCard label="Formats supported" value="PDF & DOCX" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/80 p-4 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}
