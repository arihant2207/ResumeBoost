import {
  BarChart3,
  FileCheck,
  FileUp,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: FileUp,
    title: "Smart upload",
    description:
      "Drop your PDF or DOCX resume. We extract and structure your experience automatically.",
  },
  {
    icon: Target,
    title: "JD analysis",
    description:
      "Paste any job description. AI identifies required skills, keywords, and seniority signals.",
  },
  {
    icon: Sparkles,
    title: "AI optimization",
    description:
      "Bullets and summary rewritten to align with the role while staying truthful to your background.",
  },
  {
    icon: BarChart3,
    title: "ATS scoring",
    description:
      "See keyword coverage, formatting checks, and actionable suggestions before you apply.",
  },
  {
    icon: FileCheck,
    title: "LaTeX PDF export",
    description:
      "Clean, single-column layouts that parse reliably in applicant tracking systems.",
  },
  {
    icon: Zap,
    title: "Fast turnaround",
    description:
      "From upload to downloadable PDF in minutes — no manual reformatting in Word.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t bg-muted/20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to beat the ATS
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for job seekers who want data-driven resume improvements, not
            generic templates.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/60 bg-card/50 transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="sr-only">{feature.title}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
